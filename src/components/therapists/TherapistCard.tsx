import { motion } from "framer-motion";
import { Star, MessageCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { TherapistChat } from "./TherapistChat";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { bookSession } from "@/services/bookingService";
import { CalendarIcon } from "lucide-react";

interface TherapistCardProps
{
	id: number;
	name: string;
	specialty: string;
	rating: number;
	reviews: number;
	experience: string;
	image: string;
	available: boolean;
	delay?: number;
	systemPrompt: string;
}

export function TherapistCard({
	id,
	name,
	specialty,
	rating,
	reviews,
	experience,
	image,
	available,
	delay = 0,
	systemPrompt,
}: TherapistCardProps)
{
	const [showChat, setShowChat] = useState(false);
	const [showBookingDialog, setShowBookingDialog] = useState(false);
	const [bookingDate, setBookingDate] = useState("");
	const [isBooking, setIsBooking] = useState(false);
	const { user } = useAuth();
	const { toast } = useToast();

	const handleChat = () =>
	{
		if (!user)
		{
			toast({
				title: "Please log in",
				description: "You need to be logged in to chat with a therapist.",
				variant: "destructive",
			});
			return;
		}
		setShowChat(true);
	};

	const handleBookSession = async () => {
		if (!user) {
			toast({
				title: "Please log in",
				description: "You need to be logged in to book a session.",
				variant: "destructive",
			});
			return;
		}
		
		if (!bookingDate) {
			toast({
				title: "Date required",
				description: "Please select a date and time for your session.",
				variant: "destructive",
			});
			return;
		}

		try {
			setIsBooking(true);
			await bookSession(user.id, id, new Date(bookingDate).toISOString());
			
			toast({
				title: "Session Booked!",
				description: `Your session with ${name} has been scheduled.`,
			});
			
			setShowBookingDialog(false);
			setBookingDate("");
		} catch (error) {
			toast({
				title: "Booking failed",
				description: "There was an error scheduling your session. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsBooking(false);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}
			className="group rounded-2xl bg-card p-6 shadow-card transition-all hover:shadow-lg"
		>
			<div className="flex gap-4">
				{/* Avatar */}
				<div className="relative">
					<div className="h-20 w-20 overflow-hidden rounded-2xl bg-secondary">
						<img
							src={image}
							alt={name}
							className="h-full w-full object-cover transition-transform group-hover:scale-105"
						/>
					</div>
					{available && (
						<div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card bg-success" />
					)}
				</div>

				{/* Info */}
				<div className="flex-1">
					<div className="flex items-start justify-between">
						<div>
							<h3 className="font-display text-lg font-bold text-foreground">
								{name}
							</h3>
							<p className="text-sm text-primary">{specialty}</p>
						</div>
						<div className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1">
							<Star className="h-4 w-4 fill-warning text-warning" />
							<span className="text-sm font-semibold text-foreground">
								{rating}
							</span>
						</div>
					</div>

					<div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
						<span className="flex items-center gap-1">
							<Award className="h-4 w-4" />
							{experience}
						</span>
						<span>•</span>
						<span>{reviews} reviews</span>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
				<div className="flex w-full gap-2">
					<Button
						variant="outline"
						className="flex-1"
						onClick={handleChat}
					>
						<MessageCircle className="mr-2 h-4 w-4" />
						Chat Now
					</Button>
					
					<Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
						<DialogTrigger asChild>
							<Button className="flex-1">
								<CalendarIcon className="mr-2 h-4 w-4" />
								Book Session
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Book a Session with {name}</DialogTitle>
								<DialogDescription>
									Select a date and time for your upcoming therapy session.
								</DialogDescription>
							</DialogHeader>
							<div className="flex flex-col gap-4 py-4">
								<div className="flex flex-col gap-2">
									<Label htmlFor="datetime">Date and Time</Label>
									<Input
										id="datetime"
										type="datetime-local"
										value={bookingDate}
										onChange={(e) => setBookingDate(e.target.value)}
										min={new Date().toISOString().slice(0, 16)}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setShowBookingDialog(false)}>
									Cancel
								</Button>
								<Button onClick={handleBookSession} disabled={isBooking || !bookingDate}>
									{isBooking ? "Booking..." : "Confirm Booking"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>

				{/* AI Chat Window */}
					<TherapistChat
						isOpen={showChat}
						onClose={() => setShowChat(false)}
						therapistId={id}
						therapistName={name}
						specialty={specialty}
						systemPrompt={systemPrompt}
					/>
			</div>
		</motion.div>
	);
}
