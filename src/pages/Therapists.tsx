import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TherapistCard } from "@/components/therapists/TherapistCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { motion } from "framer-motion";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { chatWithAI } from "@/services/chatService";

interface Therapist
{
	id: number;
	name: string;
	specialty: string;
	rating: number;
	reviews: number;
	experience: string;
	image: string;
	available: boolean;
	systemPrompt: string; // Add this
}

// Hardcoded data removed in favor of Supabase fetch

const Therapists = () =>
{
	// Fetch therapists from Supabase
	const { data: therapists, isLoading } = useQuery({
		queryKey: ["therapists"],
		queryFn: async () =>
		{
			const { data, error } = await supabase
				.from("therapists")
				.select("*")
				.order("id");

			if (error)
			{
				console.error("Error fetching therapists:", error);
				return [];
			}

			// Map DB columns to our interface if generic names differ, 
			// but here they match mostly. DB has snake_case usually, need to check.
			// The SQL used: name, specialty, rating, reviews_count, experience, fee, image_url, available, system_prompt
			// Our interface: id, name, specialty, rating, reviews, experience, image, available, systemPrompt

			return (data || []).map(t => ({
				id: t.id,
				name: t.name,
				specialty: t.specialty,
				rating: Number(t.rating),
				reviews: t.reviews_count,
				experience: t.experience,
				image: t.image_url,
				available: t.available,
				systemPrompt: t.system_prompt
			}));
		}
	});

	return (
		<DashboardLayout>
			<div className="space-y-8">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
				>
					<div>
						<h1 className="font-display text-3xl font-bold text-foreground">
							Speech Therapists
						</h1>
						<p className="mt-1 text-muted-foreground">
							Find and book sessions with certified professionals
						</p>
					</div>
					<Button variant="outline" className="gap-2">
						<SlidersHorizontal className="h-4 w-4" />
						Filters
					</Button>
				</motion.div>

				{/* Search */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.1 }}
					className="relative max-w-md"
				>
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search by name or specialty..."
						className="pl-10"
					/>
				</motion.div>

				{/* Therapist Grid */}
				{isLoading ? (
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{[...Array(6)].map((_, i) => (
							<div key={i} className="h-[400px] rounded-2xl bg-card/50 animate-pulse" />
						))}
					</div>
				) : (
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{therapists?.map((therapist, index) => (
							<TherapistCard
								key={therapist.id}
								id={therapist.id}
								name={therapist.name}
								specialty={therapist.specialty}
								rating={therapist.rating}
								reviews={therapist.reviews}
								experience={therapist.experience}
								image={therapist.image}
								available={therapist.available}
								delay={index * 0.1}
								systemPrompt={therapist.systemPrompt}
							/>
						))}
					</div>
				)}
			</div>
		</DashboardLayout>
	);
};

export default Therapists;
