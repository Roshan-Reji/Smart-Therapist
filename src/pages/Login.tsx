import { useState } from "react";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () =>
{
	const { signInWithEmail, signUpWithEmail } = useAuth();
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [fullName, setFullName] = useState("");
	const [loading, setLoading] = useState(false);
	const [mode, setMode] = useState<"login" | "signup">("login");
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) =>
	{
		e.preventDefault();
		setError(null);
		setInfo(null);
		setLoading(true);

		try
		{
			if (mode === "login")
			{
				const { error } = await signInWithEmail(email, password);
				if (error)
				{
					setError(error);
				} else
				{
					navigate("/");
				}
			} else
			{
				const { error, requiresVerification } = await signUpWithEmail(
					email,
					password,
					fullName
				);
				if (error)
				{
					setError(error);
				} else if (requiresVerification)
				{
					setInfo(
						"Sign up successful. Please check your email to confirm your account."
					);
				} else
				{
					navigate("/");
				}
			}
		} finally
		{
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center gradient-hero px-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="w-full max-w-md"
			>
				<div className="flex items-center justify-center mb-6">
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary mr-3">
						<Mic className="h-6 w-6 text-primary-foreground" />
					</div>
					<div>
						<h1 className="font-display text-2xl font-bold text-foreground">
							THERA <span className="text-primary">SMART</span>
						</h1>
						<p className="text-sm text-muted-foreground">
							Speech therapy made fun
						</p>
					</div>
				</div>

				<Card className="p-6 shadow-card bg-card/90 backdrop-blur">
					<h2 className="font-display text-xl font-bold mb-1 text-foreground">
						{mode === "login" ? "Welcome back" : "Create your account"}
					</h2>
					<p className="text-sm text-muted-foreground mb-4">
						{mode === "login"
							? "Log in to continue your speech practice journey."
							: "Sign up to start personalized speech therapy sessions."}
					</p>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								autoComplete="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>

						{mode === "signup" && (
							<div className="space-y-2">
								<Label htmlFor="fullName">Full Name</Label>
								<Input
									id="fullName"
									type="text"
									autoComplete="name"
									required
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
								/>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								autoComplete={
									mode === "login" ? "current-password" : "new-password"
								}
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>

						{error && (
							<p className="text-sm text-destructive bg-destructive/10 border border-destructive/40 rounded-md px-3 py-2">
								{error}
							</p>
						)}

						{info && (
							<p className="text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/40 rounded-md px-3 py-2">
								{info}
							</p>
						)}

						<Button type="submit" className="w-full" disabled={loading}>
							{loading
								? "Please wait..."
								: mode === "login"
									? "Log in"
									: "Sign up"}
						</Button>
					</form>

					<div className="mt-4 text-center text-sm text-muted-foreground">
						{mode === "login" ? (
							<>
								Don&apos;t have an account?{" "}
								<button
									type="button"
									onClick={() => setMode("signup")}
									className="text-primary underline underline-offset-2"
								>
									Sign up
								</button>
							</>
						) : (
							<>
								Already have an account?{" "}
								<button
									type="button"
									onClick={() => setMode("login")}
									className="text-primary underline underline-offset-2"
								>
									Log in
								</button>
							</>
						)}
					</div>
				</Card>
			</motion.div>
		</div>
	);
};

export default Login;


