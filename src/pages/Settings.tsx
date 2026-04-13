import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import
{
	User,
	Bell,
	Eye,
	Volume2,
	Globe,
	Shield,
	Accessibility,
	Sun,
	Moon,
	Monitor
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";

import { useAuth } from "@/contexts/AuthContext";

import { supabase } from "@/utils/supabase";
import { useEffect } from "react";

import
{
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const Settings = () =>
{
	const { user } = useAuth();
	const { theme, setTheme } = useTheme();
	const [notifications, setNotifications] = useState(true);
	const [soundEffects, setSoundEffects] = useState(true);
	const [highContrast, setHighContrast] = useState(false);
	const [largeText, setLargeText] = useState(false);
	const [reducedMotion, setReducedMotion] = useState(false);
	const [fontSize, setFontSize] = useState([16]);

	// Edit Profile State
	const [isEditingProfile, setIsEditingProfile] = useState(false);
	const [editName, setEditName] = useState("");

	// Initialize edit name when user loads
	useEffect(() =>
	{
		if (user?.user_metadata?.full_name)
		{
			setEditName(user.user_metadata.full_name);
		}
	}, [user]);

	// Apply Accessibility Settings
	useEffect(() =>
	{
		// High Contrast
		if (highContrast)
		{
			document.documentElement.classList.add("high-contrast");
		} else
		{
			document.documentElement.classList.remove("high-contrast");
		}

		// Font Size
		// We'll set a custom property or directly change root font-size percentage
		// Default is usually 16px (100%). We can scale it.
		const percentage = (fontSize[0] / 16) * 100;
		document.documentElement.style.fontSize = `${percentage}%`;

		// Reduced Motion is usually handled by media query, but we can force it via class if needed
		// or rely on the state being passed to animations.
	}, [highContrast, fontSize]);

	// Handle Sound Effects Persistence
	useEffect(() =>
	{
		localStorage.setItem("soundEffectsEnabled", JSON.stringify(soundEffects));
	}, [soundEffects]);

	// Handle Notifications Permission
	const handleNotificationChange = async (enabled: boolean) =>
	{
		setNotifications(enabled);
		if (enabled)
		{
			if ("Notification" in window)
			{
				const permission = await Notification.requestPermission();
				if (permission !== "granted")
				{
					setNotifications(false);
					toast({
						title: "Permission Denied",
						description: "Please enable notifications in your browser settings.",
						variant: "destructive"
					});
				}
			}
		}
	};

	// Fetch settings on load
	useEffect(() =>
	{
		const fetchSettings = async () =>
		{
			if (!user) return;
			const { data, error } = await supabase
				.from("user_settings")
				.select("*")
				.eq("user_id", user.id)
				.single();

			if (data)
			{
				// Apply fetched settings
				if (data.theme) setTheme(data.theme as "light" | "dark" | "system");
				setNotifications(data.notifications);
				setSoundEffects(data.sound_effects);
				setHighContrast(data.high_contrast);
				setLargeText(data.large_text);
				setReducedMotion(data.reduced_motion);
				setFontSize([data.font_size]);

				// Sync local storage on load
				localStorage.setItem("soundEffectsEnabled", JSON.stringify(data.sound_effects));
			}
		};
		fetchSettings();
	}, [user]);

	const handleSave = async () =>
	{
		if (!user) return;

		const { error } = await supabase.from("user_settings").upsert({
			user_id: user.id,
			theme,
			notifications,
			sound_effects: soundEffects,
			high_contrast: highContrast,
			large_text: largeText,
			reduced_motion: reducedMotion,
			font_size: fontSize[0],
			updated_at: new Date().toISOString()
		});

		if (error)
		{
			console.error("Error saving settings:", error);
			toast({
				title: "Error",
				description: "Failed to save settings.",
				variant: "destructive",
			});
			return;
		}

		toast({
			title: "Settings Saved",
			description: "Your preferences have been updated successfully.",
		});
	};

	const handleUpdateProfile = async () =>
	{
		if (!user) return;

		try
		{
			const { error } = await supabase.auth.updateUser({
				data: { full_name: editName }
			});

			if (error) throw error;

			toast({
				title: "Profile Updated",
				description: "Your profile information has been updated.",
			});
			setIsEditingProfile(false);

			// Force a reload or wait for auth state change to reflect in UI immediately
			// In simpler apps, passing `editName` to `fullName` display temporarily works too
			// But specialized AuthContext usually catches this.

		} catch (error)
		{
			console.error("Error updating profile:", error);
			toast({
				title: "Error",
				description: "Failed to update profile",
				variant: "destructive"
			});
		}
	};

	const fullName = user?.user_metadata?.full_name || "User";
	const email = user?.email || "No email";

	return (
		<DashboardLayout>
			<div className="max-w-3xl space-y-8">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					<h1 className="font-display text-3xl font-bold text-foreground">
						Settings
					</h1>
					<p className="mt-1 text-muted-foreground">
						Customize your app experience
					</p>
				</motion.div>

				{/* Profile Section */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.1 }}
					className="rounded-2xl bg-card p-6 shadow-card"
				>
					<div className="mb-4 flex items-center gap-3">
						<User className="h-5 w-5 text-primary" />
						<h2 className="font-display text-lg font-bold text-foreground">
							Profile
						</h2>
					</div>
					<div className="flex items-center gap-4">
						<div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-teal-500" />
						<div>
							<p className="font-semibold text-foreground">{fullName}</p>
							<p className="text-sm text-muted-foreground">{email}</p>
						</div>

						<Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
							<DialogTrigger asChild>
								<Button variant="outline" className="ml-auto">
									Edit Profile
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Edit Profile</DialogTitle>
									<DialogDescription>
										Make changes to your profile here. Click save when you're done.
									</DialogDescription>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="grid grid-cols-4 items-center gap-4">
										<Label htmlFor="name" className="text-right">
											Name
										</Label>
										<Input
											id="name"
											value={editName}
											onChange={(e) => setEditName(e.target.value)}
											className="col-span-3"
										/>
									</div>
									<div className="grid grid-cols-4 items-center gap-4">
										<Label htmlFor="email" className="text-right">
											Email
										</Label>
										<Input
											id="email"
											value={email}
											disabled
											className="col-span-3 bg-muted"
										/>
									</div>
								</div>
								<DialogFooter>
									<Button onClick={handleUpdateProfile}>Save changes</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</motion.div>

				{/* Appearance */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.15 }}
					className="rounded-2xl bg-card p-6 shadow-card"
				>
					<div className="mb-4 flex items-center gap-3">
						<Eye className="h-5 w-5 text-primary" />
						<h2 className="font-display text-lg font-bold text-foreground">
							Appearance
						</h2>
					</div>
					<div className="space-y-4">
						<div>
							<Label className="mb-3 block text-foreground">Theme</Label>
							<div className="flex gap-2">
								<Button
									variant={theme === "light" ? "default" : "outline"}
									size="sm"
									onClick={() => setTheme("light")}
									className="gap-2"
								>
									<Sun className="h-4 w-4" />
									Light
								</Button>
								<Button
									variant={theme === "dark" ? "default" : "outline"}
									size="sm"
									onClick={() => setTheme("dark")}
									className="gap-2"
								>
									<Moon className="h-4 w-4" />
									Dark
								</Button>
								<Button
									variant={theme === "system" ? "default" : "outline"}
									size="sm"
									onClick={() => setTheme("system")}
									className="gap-2"
								>
									<Monitor className="h-4 w-4" />
									System
								</Button>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Notifications */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.2 }}
					className="rounded-2xl bg-card p-6 shadow-card"
				>
					<div className="mb-4 flex items-center gap-3">
						<Bell className="h-5 w-5 text-primary" />
						<h2 className="font-display text-lg font-bold text-foreground">
							Notifications
						</h2>
					</div>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<Label htmlFor="notifications" className="text-foreground">
									Push Notifications
								</Label>
								<p className="text-sm text-muted-foreground">
									Receive reminders for practice sessions
								</p>
							</div>
							<Switch
								id="notifications"
								checked={notifications}
								onCheckedChange={handleNotificationChange}
							/>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<Label htmlFor="sounds" className="text-foreground">
									Sound Effects
								</Label>
								<p className="text-sm text-muted-foreground">
									Play sounds during games and exercises
								</p>
							</div>
							<Switch
								id="sounds"
								checked={soundEffects}
								onCheckedChange={setSoundEffects}
							/>
						</div>
					</div>
				</motion.div>

				{/* Accessibility */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.2 }}
					className="rounded-2xl bg-card p-6 shadow-card"
				>
					<div className="mb-4 flex items-center gap-3">
						<Accessibility className="h-5 w-5 text-primary" />
						<h2 className="font-display text-lg font-bold text-foreground">
							Accessibility
						</h2>
					</div>
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div>
								<Label htmlFor="contrast" className="text-foreground">
									High Contrast Mode
								</Label>
								<p className="text-sm text-muted-foreground">
									Increase contrast for better visibility
								</p>
							</div>
							<Switch
								id="contrast"
								checked={highContrast}
								onCheckedChange={setHighContrast}
							/>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<Label htmlFor="largetext" className="text-foreground">
									Large Text
								</Label>
								<p className="text-sm text-muted-foreground">
									Increase text size throughout the app
								</p>
							</div>
							<Switch
								id="largetext"
								checked={largeText}
								onCheckedChange={setLargeText}
							/>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<Label htmlFor="motion" className="text-foreground">
									Reduced Motion
								</Label>
								<p className="text-sm text-muted-foreground">
									Minimize animations and transitions
								</p>
							</div>
							<Switch
								id="motion"
								checked={reducedMotion}
								onCheckedChange={setReducedMotion}
							/>
						</div>
						<div>
							<Label className="text-foreground">Font Size</Label>
							<p className="mb-3 text-sm text-muted-foreground">
								Adjust the base font size
							</p>
							<div className="flex items-center gap-4">
								<span className="text-sm text-muted-foreground">A</span>
								<Slider
									value={fontSize}
									onValueChange={setFontSize}
									max={24}
									min={12}
									step={1}
									className="flex-1"
								/>
								<span className="text-lg text-muted-foreground">A</span>
								<span className="w-12 text-center text-sm font-medium text-foreground">
									{fontSize}px
								</span>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Save Button */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.25 }}
				>
					<Button onClick={handleSave} className="w-full sm:w-auto">
						Save Settings
					</Button>
				</motion.div>
			</div>
		</DashboardLayout>
	);
};

export default Settings;
