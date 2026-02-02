import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppHeader } from "@/components/AppHeader";
import { authService } from "@/services/authService";
import { referralService } from "@/services/referralService";
import { membershipService } from "@/services/membershipService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, DollarSign, Check, AlertCircle } from "lucide-react";
import Link from "next/link";
import { systemSettingsService } from "@/services/systemSettingsService";
import { supabase } from "@/integrations/supabase/client";

interface CountryPricing {
  membershipFeeAmount: number;
  currencyCode: string;
  currencySymbol: string;
  countryName: string;
}

export default function SignupPage() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [acceptedAgreement, setAcceptedAgreement] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [validatingReferral, setValidatingReferral] = useState(false);
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralMessage, setReferralMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  
  const [pricing, setPricing] = useState<CountryPricing | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    agreement: "",
  });
  
  useEffect(() => {
    // Always fetch pricing for Bangladesh (locked deployment)
    fetchCountryPricing("BD");
  }, []);

  useEffect(() => {
    if (!referralCode || referralCode.trim() === "") {
      setReferralValid(null);
      setReferralMessage("");
      return;
    }

    // Only validate against backend if format is valid
    const formatError = validateReferralFormat(referralCode);
    if (formatError) {
      setReferralValid(false);
      setReferralMessage(formatError);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkReferralCodeWithBackend(referralCode.trim());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [referralCode]);

  useEffect(() => {
    checkIfAlreadyLoggedIn();
  }, [router]);

  useEffect(() => {
    async function checkRegistrationStatus() {
      try {
        const enabled = await systemSettingsService.isMemberRegistrationEnabled();
        setRegistrationEnabled(enabled);
      } catch (error) {
        console.error("Error checking registration status:", error);
        setRegistrationEnabled(false);
      } finally {
        setCheckingRegistration(false);
      }
    }

    checkRegistrationStatus();
  }, []);

  async function checkIfAlreadyLoggedIn() {
    const user = await authService.getCurrentUser();
    if (user) {
      router.push("/dashboard");
    }
  }

  function validateFullName(name: string): string {
    if (!name.trim()) return "Full name is required";
    const words = name.trim().split(/\s+/);
    if (words.length < 2) return "Please enter at least first and last name";
    return "";
  }

  function validateEmail(email: string): string {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  }

  function validatePassword(password: string): string {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Password must include at least 1 uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must include at least 1 lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must include at least 1 number";
    return "";
  }

  function validateConfirmPassword(password: string, confirmPassword: string): string {
    if (!confirmPassword) return "Please confirm your password";
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  }

  function validateReferralFormat(code: string): string {
    if (!code) return "";
    if (code.length < 6 || code.length > 20) return "Referral code must be 6-20 characters";
    if (!/^[A-Z0-9-]+$/i.test(code)) return "Referral code can only contain letters, numbers, and dashes";
    return "";
  }

  function validateAgreement(accepted: boolean): string {
    if (!accepted) return "You must accept the agreement to continue";
    return "";
  }

  function validateForm(): boolean {
    const newErrors = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
      referralCode: validateReferralFormat(referralCode),
      agreement: validateAgreement(acceptedAgreement),
    };

    setErrors({ ...newErrors });

    return !Object.values(newErrors).some((error) => error !== "");
  }

  function handleFieldBlur(field: keyof typeof errors) {
    const newErrors = { ...errors };

    switch (field) {
      case "fullName":
        newErrors.fullName = validateFullName(fullName);
        break;
      case "email":
        newErrors.email = validateEmail(email);
        break;
      case "password":
        newErrors.password = validatePassword(password);
        break;
      case "confirmPassword":
        newErrors.confirmPassword = validateConfirmPassword(password, confirmPassword);
        break;
      case "referralCode":
        newErrors.referralCode = validateReferralFormat(referralCode);
        break;
      case "agreement":
        newErrors.agreement = validateAgreement(acceptedAgreement);
        break;
    }

    setErrors(newErrors);
  }

  async function fetchCountryPricing(code: string) {
    setLoadingPricing(true);
    try {
      const response = await fetch(`/api/settings/country?countryCode=${code}`);
      
      if (!response.ok) {
        setErrorMessage("Country not available for registration");
        setPricing(null);
        return;
      }

      const data: CountryPricing = await response.json();
      setPricing(data);
    } catch (error) {
      console.error("Error fetching pricing:", error);
      setErrorMessage("Error loading membership pricing");
      setPricing(null);
    } finally {
      setLoadingPricing(false);
    }
  }

  async function checkReferralCodeWithBackend(code: string) {
    setValidatingReferral(true);
    setReferralValid(null);
    
    try {
      const result = await referralService.validateReferralCode(code);
      
      setReferralValid(result.isValid);
      setReferralMessage(result.message);
    } catch (error) {
      console.error("Error validating referral code:", error);
      setReferralValid(false);
      setReferralMessage("Error validating referral code");
    } finally {
      setValidatingReferral(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) {
      setErrorMessage("Please fix the errors below before submitting");
      return;
    }

    if (!pricing) {
      setErrorMessage("Please select a country to see membership pricing");
      return;
    }

    if (referralCode && !referralValid) {
      setErrorMessage("Please enter a valid referral code or leave it blank");
      return;
    }

    setLoading(true);

    try {
      const signupData = {
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        countryCode: "BD", // Hardcoded for Bangladesh-only launch
        referralCode: referralCode.trim() || undefined,
      };

      const { user, error: signupError } = await authService.signUp(email, password);

      if (signupError || !user) {
        setErrorMessage(signupError?.message || "Signup failed");
        setLoading(false);
        return;
      }

      if (referralCode && referralValid) {
        await referralService.createReferralRecord(user.id, referralCode.trim());
      }

      const membershipNumber = Math.floor(100000 + Math.random() * 900000);

      const membershipResult = await membershipService.createMembership(
        user.id,
        membershipNumber,
        pricing.membershipFeeAmount,
        pricing.currencyCode
      );

      if (!membershipResult.success) {
        setErrorMessage("Failed to create membership. Please contact support.");
        setLoading(false);
        return;
      }

      setSuccessMessage(
        `Registration successful! Membership fee: ৳${pricing.membershipFeeAmount} BDT. Please proceed to payment.`
      );

      setTimeout(() => {
        router.push("/payment-pending");
      }, 3000);

    } catch (error) {
      console.error("Error during signup:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center border-b pb-6">
          <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Join Migrate Safely and start your secure migration journey
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          {checkingRegistration ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground mt-4">Loading...</p>
            </div>
          ) : !registrationEnabled ? (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-900 dark:text-orange-100">
                <p className="font-semibold text-lg mb-2">🚧 Registrations Temporarily Paused</p>
                <p className="mb-4">
                  We're preparing for our official launch! New member registrations are currently paused 
                  while we finalize everything to ensure the best experience for you.
                </p>
                <p className="font-medium">
                  Please check back soon. We'll be opening registrations very shortly!
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {successMessage && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors({ ...errors, fullName: "" });
                    }}
                    onBlur={() => handleFieldBlur("fullName")}
                    className={errors.fullName ? "border-red-500" : ""}
                    required
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    onBlur={() => handleFieldBlur("email")}
                    className={errors.email ? "border-red-500" : ""}
                    required
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: "" });
                      if (errors.confirmPassword && confirmPassword) {
                        setErrors({ ...errors, password: "", confirmPassword: validateConfirmPassword(e.target.value, confirmPassword) });
                      }
                    }}
                    onBlur={() => handleFieldBlur("password")}
                    className={errors.password ? "border-red-500" : ""}
                    required
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                  )}
                  {!errors.password && password && (
                    <p className="text-xs text-muted-foreground">
                      Must include: 1 uppercase, 1 lowercase, 1 number
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                    }}
                    onBlur={() => handleFieldBlur("confirmPassword")}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                    required
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Membership Fee Display */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  {loadingPricing ? (
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading membership fee...</span>
                    </div>
                  ) : pricing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                        <DollarSign className="h-5 w-5" />
                        <span className="font-semibold">Membership Fee (Bangladesh):</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        ৳{pricing.membershipFeeAmount} BDT
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Bangladeshi Taka (BDT) — set by MigrateSafely.com Admin
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Unable to load membership fee
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="referralCode">
                    Referral Code (Optional)
                  </Label>
                  <Input
                    id="referralCode"
                    type="text"
                    value={referralCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setReferralCode(value);
                      if (errors.referralCode) setErrors({ ...errors, referralCode: "" });
                    }}
                    onBlur={() => handleFieldBlur("referralCode")}
                    placeholder="Enter referral code"
                    maxLength={20}
                    className={errors.referralCode ? "border-red-500" : ""}
                  />
                  {errors.referralCode && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.referralCode}</p>
                  )}
                  {!errors.referralCode && referralCode && validatingReferral && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Validating referral code...
                    </p>
                  )}
                  {!errors.referralCode && referralCode && !validatingReferral && referralValid === true && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      ✓ {referralMessage}
                    </p>
                  )}
                  {!errors.referralCode && referralCode && !validatingReferral && referralValid === false && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      ✗ {referralMessage}
                    </p>
                  )}
                  {!referralCode && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter a referral code if you have one
                    </p>
                  )}
                </div>

                {/* Agreement Acceptance */}
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="acceptAgreement"
                    checked={acceptedAgreement}
                    onCheckedChange={(checked) => {
                      setAcceptedAgreement(checked === true);
                      if (errors.agreement) setErrors({ ...errors, agreement: "" });
                    }}
                    className={errors.agreement ? "border-red-500" : ""}
                    required
                  />
                  <label
                    htmlFor="acceptAgreement"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the{" "}
                    <Link
                      href="/member-agreement"
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      Member User Agreement
                    </Link>
                    ,{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      Terms
                    </Link>
                    ,{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      Privacy
                    </Link>
                    {" "}and{" "}
                    <Link
                      href="/disclaimer"
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      Disclaimer
                    </Link>
                    .
                  </label>
                </div>
                {errors.agreement && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.agreement}</p>
                )}

                <p className="text-sm text-muted-foreground mt-1">
                  Note: Referral bonuses are promotional and may expire or change.
                </p>

                <Button
                  type="submit"
                  disabled={loading || !pricing || (referralCode && !referralValid) || Object.values(errors).some((error) => error !== "")}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
              </form>

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  By registering, you agree to our Terms of Service and Privacy Policy.
                  Your membership will be activated after payment confirmation.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}