import
	{
		createContext,
		useContext,
		useEffect,
		useState,
		ReactNode,
	} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

type AuthContextValue = {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signInWithEmail: (email: string, password: string) => Promise<{
		error?: string;
	}>;
	signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{
		error?: string;
		requiresVerification?: boolean;
	}>;
	signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode })
{
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() =>
	{
		let isMounted = true;

		async function init()
		{
			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (!isMounted) return;

			setSession(session ?? null);
			setUser(session?.user ?? null);
			setLoading(false);
		}

		init();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) =>
		{
			setSession(session ?? null);
			setUser(session?.user ?? null);
		});

		return () =>
		{
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	const signInWithEmail: AuthContextValue["signInWithEmail"] = async (
		email,
		password
	) =>
	{
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error)
		{
			return { error: error.message };
		}

		return {};
	};

	const signUpWithEmail: AuthContextValue["signUpWithEmail"] = async (
		email,
		password,
		fullName
	) =>
	{
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					full_name: fullName,
				},
			},
		});

		if (error)
		{
			return { error: error.message };
		}

		return {
			requiresVerification: !data.session,
		};
	};

	const signOut = async () =>
	{
		await supabase.auth.signOut();
	};

	return (
		<AuthContext.Provider
			value={{ user, session, loading, signInWithEmail, signUpWithEmail, signOut }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth()
{
	const ctx = useContext(AuthContext);
	if (!ctx)
	{
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return ctx;
}


