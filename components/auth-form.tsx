"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";
import Link from "next/link";

interface AuthFormProps {
    mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (mode === "signup") {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;

                // Redirect to home after successful signup
                router.push("/");
                router.refresh();
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-semibold" style={{ fontFamily: '"Aldrich", sans-serif' }}>
                    Athena
                </CardTitle>
                <CardDescription>
                    {mode === "login" ? "Sign in to your account" : "Create a new account"}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            disabled={loading}
                        />
                    </div>
                    {error && (
                        <p className={`text-sm ${error.includes("Check your email") ? "text-green-600" : "text-destructive"}`}>
                            {error}
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4 mt-2">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <Loader className="h-4 w-4 animate-spin" />
                        ) : mode === "login" ? (
                            "Sign In"
                        ) : (
                            "Sign Up"
                        )}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                        {mode === "login" ? (
                            <>
                                Don&apos;t have an account?{" "}
                                <Link href="/auth/signup" className="text-primary hover:underline">
                                    Sign up
                                </Link>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}
                                <Link href="/auth/login" className="text-primary hover:underline">
                                    Sign in
                                </Link>
                            </>
                        )}
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
