import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Send, User, Mail, MapPin, Hash, AlertCircle } from "lucide-react";
import { MainHeader } from "@/components/MainHeader";

interface SearchResult {
  userId: string;
  accountType: "member" | "agent";
  fullName: string;
  email: string;
  countryCode: string;
  role: string;
  referralCode: string | null;
  memberNumber?: number | null;
  membershipStatus?: string | null;
  membershipEnd?: string | null;
  agentNumber?: string | null;
  agentStatus?: string | null;
}

export default function AdminPeopleLookup() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Message modal state
  const [messageModal, setMessageModal] = useState<{ open: boolean; userId: string; fullName: string }>({
    open: false,
    userId: "",
    fullName: "",
  });
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!profile || !["worker_admin", "manager_admin", "chairman"].includes(profile.role)) {
        router.push("/dashboard");
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error("Error checking access:", err);
      router.push("/admin");
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setError("");
    setHasSearched(true);

    try {
      const response = await fetch(`/api/admin/people/search?q=${encodeURIComponent(searchTerm.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data.results || []);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const openMessageModal = (userId: string, fullName: string) => {
    setMessageModal({ open: true, userId, fullName });
    setMessageSubject("");
    setMessageBody("");
  };

  const closeMessageModal = () => {
    setMessageModal({ open: false, userId: "", fullName: "" });
    setMessageSubject("");
    setMessageBody("");
  };

  const handleSendMessage = async () => {
    if (!messageSubject.trim() || !messageBody.trim()) {
      toast({
        title: "Required fields",
        description: "Subject and message body are required",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);

    try {
      const response = await fetch("/api/messages/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: messageModal.userId,
          subject: messageSubject.trim(),
          body: messageBody.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      toast({
        title: "Message sent",
        description: `Message sent to ${messageModal.fullName}`,
      });

      closeMessageModal();
    } catch (err) {
      console.error("Send message error:", err);
      toast({
        title: "Send failed",
        description: err instanceof Error ? err.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="People Lookup - Admin"
        description="Search and manage members and agents"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              People Lookup
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Search for members and agents by name, email, membership number, agent number, or referral code
            </p>
          </div>

          {/* Search Bar */}
          <Card className="p-6 mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, email, membership #, agent #, or referral code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={searching}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={searching || !searchTerm.trim()}
                className="px-6"
              >
                <Search className="w-4 h-4 mr-2" />
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>
          </Card>

          {/* Error State */}
          {error && (
            <Card className="p-6 mb-8 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                    Search Error
                  </h3>
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* No Results */}
          {hasSearched && !searching && results.length === 0 && !error && (
            <Card className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No results found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No members or agents match your search term &quot;{searchTerm}&quot;
              </p>
            </Card>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Found {results.length} result{results.length !== 1 ? "s" : ""}
              </div>

              {results.map((result) => (
                <Card key={result.userId} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          variant={result.accountType === "member" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {result.accountType.toUpperCase()}
                        </Badge>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {result.fullName}
                        </h3>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span>{result.email}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>{result.countryCode}</span>
                        </div>

                        {result.accountType === "member" && result.memberNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Hash className="w-4 h-4" />
                            <span>Member #: {result.memberNumber}</span>
                            {result.membershipStatus && (
                              <Badge
                                variant={
                                  result.membershipStatus === "active"
                                    ? "default"
                                    : result.membershipStatus === "pending"
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {result.membershipStatus}
                              </Badge>
                            )}
                          </div>
                        )}

                        {result.accountType === "agent" && result.agentNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Hash className="w-4 h-4" />
                            <span>Agent #: {result.agentNumber}</span>
                            {result.agentStatus && (
                              <Badge
                                variant={
                                  result.agentStatus === "APPROVED"
                                    ? "default"
                                    : result.agentStatus === "PENDING"
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {result.agentStatus}
                              </Badge>
                            )}
                          </div>
                        )}

                        {result.referralCode && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <User className="w-4 h-4" />
                            <span>Referral Code: {result.referralCode}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Dialog
                        open={messageModal.open && messageModal.userId === result.userId}
                        onOpenChange={(open) => {
                          if (!open) closeMessageModal();
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMessageModal(result.userId, result.fullName)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Send Message to {result.fullName}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="subject">Subject</Label>
                              <Input
                                id="subject"
                                placeholder="Message subject"
                                value={messageSubject}
                                onChange={(e) => setMessageSubject(e.target.value)}
                                disabled={sendingMessage}
                              />
                            </div>
                            <div>
                              <Label htmlFor="message">Message</Label>
                              <Textarea
                                id="message"
                                placeholder="Type your message here..."
                                value={messageBody}
                                onChange={(e) => setMessageBody(e.target.value)}
                                disabled={sendingMessage}
                                rows={6}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={closeMessageModal}
                                disabled={sendingMessage}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleSendMessage} disabled={sendingMessage}>
                                {sendingMessage ? "Sending..." : "Send Message"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Accordion for detailed info */}
                  <Accordion type="single" collapsible>
                    <AccordionItem value="details">
                      <AccordionTrigger className="text-sm">View File</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                User ID:
                              </span>
                              <p className="text-gray-600 dark:text-gray-400 font-mono text-xs break-all">
                                {result.userId}
                              </p>
                            </div>

                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Role:
                              </span>
                              <p className="text-gray-600 dark:text-gray-400">{result.role}</p>
                            </div>

                            {result.accountType === "member" && (
                              <>
                                {result.memberNumber && (
                                  <div>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                      Membership Number:
                                    </span>
                                    <p className="text-gray-600 dark:text-gray-400">
                                      {result.memberNumber}
                                    </p>
                                  </div>
                                )}

                                {result.membershipStatus && (
                                  <div>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                      Membership Status:
                                    </span>
                                    <p className="text-gray-600 dark:text-gray-400">
                                      {result.membershipStatus}
                                    </p>
                                  </div>
                                )}

                                {result.membershipEnd && (
                                  <div>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                      Membership End:
                                    </span>
                                    <p className="text-gray-600 dark:text-gray-400">
                                      {new Date(result.membershipEnd).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </>
                            )}

                            {result.accountType === "agent" && (
                              <>
                                {result.agentNumber && (
                                  <div>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                      Agent Number:
                                    </span>
                                    <p className="text-gray-600 dark:text-gray-400">
                                      {result.agentNumber}
                                    </p>
                                  </div>
                                )}

                                {result.agentStatus && (
                                  <div>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                      Agent Status:
                                    </span>
                                    <p className="text-gray-600 dark:text-gray-400">
                                      {result.agentStatus}
                                    </p>
                                  </div>
                                )}
                              </>
                            )}

                            {result.referralCode && (
                              <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  Referral Code:
                                </span>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {result.referralCode}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}