import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Save } from "lucide-react";
import { MainHeader } from "@/components/MainHeader";

interface ExtendedCountrySettings {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  membershipFeeAmount: number;
  referralBonusAmount: number;
  isActive: boolean;
  paymentGatewayProvider?: string;
}

export default function CountrySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  const [countries, setCountries] = useState<ExtendedCountrySettings[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<ExtendedCountrySettings | null>(null);
  
  const [membershipFeeAmount, setMembershipFeeAmount] = useState<string>("0");
  const [referralBonusAmount, setReferralBonusAmount] = useState<string>("0");
  const [isActive, setIsActive] = useState<boolean>(false);
  
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  useEffect(() => {
    if (selectedCountryCode) {
      const country = countries.find(c => c.countryCode === selectedCountryCode);
      if (country) {
        setSelectedCountry(country);
        setMembershipFeeAmount(country.membershipFeeAmount.toString());
        setReferralBonusAmount(country.referralBonusAmount.toString());
        setIsActive(country.isActive);
        setSuccessMessage("");
        setErrorMessage("");
      }
    }
  }, [selectedCountryCode, countries]);

  async function checkSuperAdminAccess() {
    try {
      const user = await authService.getCurrentUser();
      
      if (!user) {
        router.push("/");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const { data: employee } = await supabase
        .from("employees")
        .select("role_category")
        .eq("user_id", user.id)
        .maybeSingle();

      const isChairman = employee?.role_category === "chairman";
      
      if (!isChairman) {
        router.push("/dashboard");
        return;
      }

      if (error || !profile || profile.role !== "super_admin") {
        setErrorMessage("Access Denied: Super Admin privileges required");
        setLoading(false);
        setTimeout(() => router.push("/"), 2000);
        return;
      }

      setIsSuperAdmin(true);
      await loadCountrySettings();
    } catch (error) {
      console.error("Error checking admin access:", error);
      setErrorMessage("Error verifying access");
      setLoading(false);
    }
  }

  async function loadCountrySettings() {
    try {
      setLoading(true);
      
      const { data: countryData, error: countryError } = await supabase
        .from("country_settings")
        .select("*")
        .order("country_name");

      if (countryError) throw countryError;

      const settingsWithBonus: ExtendedCountrySettings[] = await Promise.all(
        (countryData || []).map(async (country) => {
          const { data: configData } = await supabase
            .from("membership_config")
            .select("referral_bonus_amount")
            .eq("country_code", country.country_code)
            .order("effective_from", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            countryCode: country.country_code,
            countryName: country.country_name,
            currencyCode: country.currency_code,
            currencySymbol: country.currency_symbol,
            membershipFeeAmount: country.membership_fee_amount,
            referralBonusAmount: configData?.referral_bonus_amount || 0,
            isActive: country.is_active,
            paymentGatewayProvider: country.payment_gateway_provider
          };
        })
      );

      setCountries(settingsWithBonus);
      
      if (selectedCountryCode) {
        const updated = settingsWithBonus.find(c => c.countryCode === selectedCountryCode);
        if (updated) setSelectedCountry(updated);
      } else if (settingsWithBonus.length > 0) {
        setSelectedCountryCode(settingsWithBonus[0].countryCode);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading settings:", error);
      setErrorMessage("Failed to load country settings");
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedCountry) return;

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const fee = parseFloat(membershipFeeAmount);
      const bonus = parseFloat(referralBonusAmount);

      if (isNaN(fee) || fee < 0) {
        setErrorMessage("Please enter a valid membership fee");
        setSaving(false);
        return;
      }

      if (isNaN(bonus) || bonus < 0) {
        setErrorMessage("Please enter a valid referral bonus amount");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("country_settings")
        .update({
          membership_fee_amount: fee,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("country_code", selectedCountry.countryCode);

      if (updateError) throw updateError;

      const { data: existingConfig } = await supabase
        .from("membership_config")
        .select("id")
        .eq("country_code", selectedCountry.countryCode)
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle();

      const configData = {
        country_code: selectedCountry.countryCode,
        referral_bonus_amount: bonus,
        referral_bonus_currency: selectedCountry.currencyCode,
        membership_fee_amount: fee,
        membership_fee_currency: selectedCountry.currencyCode,
        effective_from: new Date().toISOString(),
      };

      if (existingConfig) {
        await supabase
          .from("membership_config")
          .update({
            referral_bonus_amount: bonus,
            membership_fee_amount: fee,
          })
          .eq("id", existingConfig.id);
      } else {
        await supabase.from("membership_config").insert(configData);
      }

      await loadCountrySettings();
      setSuccessMessage("Settings updated successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      setErrorMessage("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <MainHeader />
      <div className="p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Country Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage membership fees, referral bonuses, and country availability
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configure Country</CardTitle>
              <CardDescription>
                Select a country to edit pricing and availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={selectedCountryCode}
                  onValueChange={setSelectedCountryCode}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.countryCode} value={country.countryCode}>
                        {country.countryName} ({country.countryCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCountry && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="flex items-center gap-2">
                      Currency
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </Label>
                    <div className="relative">
                      <Input
                        id="currency"
                        value={`${selectedCountry.currencySymbol} ${selectedCountry.currencyCode}`}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Currency cannot be modified (locked per country)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="membershipFee">Membership Fee Amount</Label>
                    <div className="flex gap-2 items-center">
                      <span className="text-2xl font-semibold text-foreground">
                        {selectedCountry.currencySymbol}
                      </span>
                      <Input
                        id="membershipFee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={membershipFeeAmount}
                        onChange={(e) => setMembershipFeeAmount(e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedCountry.currencyCode}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Annual membership fee charged to new members
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referralBonus">Referral Bonus Amount</Label>
                    <div className="flex gap-2 items-center">
                      <span className="text-2xl font-semibold text-foreground">
                        {selectedCountry.currencySymbol}
                      </span>
                      <Input
                        id="referralBonus"
                        type="number"
                        min="0"
                        step="0.01"
                        value={referralBonusAmount}
                        onChange={(e) => setReferralBonusAmount(e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedCountry.currencyCode}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Bonus amount credited to referrer when a new member joins from this country
                    </p>
                  </div>

                  <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="active" className="text-base">
                        Country Active
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new member registrations from this country
                      </p>
                    </div>
                    <Switch
                      id="active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>

                  {selectedCountry.paymentGatewayProvider && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Payment Gateway:</span>{" "}
                        {selectedCountry.paymentGatewayProvider}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}

              {successMessage && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Important Notes
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Currency codes and symbols are locked and cannot be changed</li>
                <li>Only Super Admins can modify membership fees and referral bonuses</li>
                <li>Referral bonuses are country-specific for new signups</li>
                <li>Deactivating a country prevents new registrations</li>
                <li>All changes are tracked and audited</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}