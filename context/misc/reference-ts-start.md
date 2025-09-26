<context>
<project_tree>
broken-start
├─ .oxlintrc.json 
├─ README.md 
├─ biome.json 
├─ bts.jsonc 
├─ bunfig.toml 
├─ package.json 
├─ tsconfig.json 
├─ turbo.json 
└─ apps/
   └─ web/
      ├─ .gitignore 
      ├─ components.json 
      ├─ package.json 
      ├─ tsconfig.json 
      ├─ vite.config.ts 
      ├─ public/
      │  └─ robots.txt 
      └─ src/
         ├─ index.css 
         ├─ router.tsx 
         ├─ components/
         │  ├─ header.tsx 
         │  ├─ loader.tsx 
         │  ├─ sign-in-form.tsx 
         │  ├─ sign-up-form.tsx 
         │  ├─ user-menu.tsx 
         │  └─ ui/
         │     └─ skeleton.tsx 
         ├─ lib/
         │  ├─ auth-client.ts 
         │  └─ utils.ts 
         └─ routes/
            ├─ __root.tsx 
            ├─ dashboard.tsx 
            ├─ index.tsx 
            └─ login.tsx 
</project_tree>
<project_files>
<file name="robots.txt" path="/apps/web/public/robots.txt">
# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:
</file>
<file name="skeleton.tsx" path="/apps/web/src/components/ui/skeleton.tsx">
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
return (
<div
data-slot="skeleton"
className={cn("bg-accent animate-pulse rounded-md", className)}
{...props}
/>
);
}

export { Skeleton };
</file>
<file name="header.tsx" path="/apps/web/src/components/header.tsx">
import { Link } from "@tanstack/react-router";
import UserMenu from "./user-menu";

export default function Header() {
const links = [
{ to: "/", label: "Home" },
{ to: "/dashboard", label: "Dashboard" },
] as const;

    return (
    	<div>
    		<div className="flex flex-row items-center justify-between px-2 py-1">
    			<nav className="flex gap-4 text-lg">
    				{links.map(({ to, label }) => {
    					return (
    						<Link key={to} to={to}>
    							{label}
    						</Link>
    					);
    				})}
    			</nav>
    			<div className="flex items-center gap-2">
    				<UserMenu />
    			</div>
    		</div>
    		<hr />
    	</div>
    );

}
</file>
<file name="loader.tsx" path="/apps/web/src/components/loader.tsx">
import { Loader2 } from "lucide-react";

export default function Loader() {
return (
<div className="flex h-full items-center justify-center pt-8">
<Loader2 className="animate-spin" />
</div>
);
}
</file>
<file name="sign-in-form.tsx" path="/apps/web/src/components/sign-in-form.tsx">
import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInForm({
onSwitchToSignUp,
}: {
onSwitchToSignUp: () => void;
}) {
const navigate = useNavigate({
from: "/",
});
const { isPending } = authClient.useSession();

    const form = useForm({
    	defaultValues: {
    		email: "",
    		password: "",
    	},
    	onSubmit: async ({ value }) => {
    		await authClient.signIn.email(
    			{
    				email: value.email,
    				password: value.password,
    			},
    			{
    				onSuccess: () => {
    					navigate({
    						to: "/dashboard",
    					});
    					toast.success("Sign in successful");
    				},
    				onError: (error) => {
    					toast.error(error.error.message || error.error.statusText);
    				},
    			},
    		);
    	},
    	validators: {
    		onSubmit: z.object({
    			email: z.email("Invalid email address"),
    			password: z.string().min(8, "Password must be at least 8 characters"),
    		}),
    	},
    });

    if (isPending) {
    	return <Loader />;
    }

    return (
    	<div className="mx-auto w-full mt-10 max-w-md p-6">
    		<h1 className="mb-6 text-center text-3xl font-bold">Welcome Back</h1>

    		<form
    			onSubmit={(e) => {
    				e.preventDefault();
    				e.stopPropagation();
    				form.handleSubmit();
    			}}
    			className="space-y-4"
    		>
    			<div>
    				<form.Field name="email">
    					{(field) => (
    						<div className="space-y-2">
    							<Label htmlFor={field.name}>Email</Label>
    							<Input
    								id={field.name}
    								name={field.name}
    								type="email"
    								value={field.state.value}
    								onBlur={field.handleBlur}
    								onChange={(e) => field.handleChange(e.target.value)}
    							/>
    							{field.state.meta.errors.map((error) => (
    								<p key={error?.message} className="text-red-500">
    									{error?.message}
    								</p>
    							))}
    						</div>
    					)}
    				</form.Field>
    			</div>

    			<div>
    				<form.Field name="password">
    					{(field) => (
    						<div className="space-y-2">
    							<Label htmlFor={field.name}>Password</Label>
    							<Input
    								id={field.name}
    								name={field.name}
    								type="password"
    								value={field.state.value}
    								onBlur={field.handleBlur}
    								onChange={(e) => field.handleChange(e.target.value)}
    							/>
    							{field.state.meta.errors.map((error) => (
    								<p key={error?.message} className="text-red-500">
    									{error?.message}
    								</p>
    							))}
    						</div>
    					)}
    				</form.Field>
    			</div>

    			<form.Subscribe>
    				{(state) => (
    					<Button
    						type="submit"
    						className="w-full"
    						disabled={!state.canSubmit || state.isSubmitting}
    					>
    						{state.isSubmitting ? "Submitting..." : "Sign In"}
    					</Button>
    				)}
    			</form.Subscribe>
    		</form>

    		<div className="mt-4 text-center">
    			<Button
    				variant="link"
    				onClick={onSwitchToSignUp}
    				className="text-indigo-600 hover:text-indigo-800"
    			>
    				Need an account? Sign Up
    			</Button>
    		</div>
    	</div>
    );

}
</file>
<file name="sign-up-form.tsx" path="/apps/web/src/components/sign-up-form.tsx">
import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignUpForm({
onSwitchToSignIn,
}: {
onSwitchToSignIn: () => void;
}) {
const navigate = useNavigate({
from: "/",
});
const { isPending } = authClient.useSession();

    const form = useForm({
    	defaultValues: {
    		email: "",
    		password: "",
    		name: "",
    	},
    	onSubmit: async ({ value }) => {
    		await authClient.signUp.email(
    			{
    				email: value.email,
    				password: value.password,
    				name: value.name,
    			},
    			{
    				onSuccess: () => {
    					navigate({
    						to: "/dashboard",
    					});
    					toast.success("Sign up successful");
    				},
    				onError: (error) => {
    					toast.error(error.error.message || error.error.statusText);
    				},
    			},
    		);
    	},
    	validators: {
    		onSubmit: z.object({
    			name: z.string().min(2, "Name must be at least 2 characters"),
    			email: z.email("Invalid email address"),
    			password: z.string().min(8, "Password must be at least 8 characters"),
    		}),
    	},
    });

    if (isPending) {
    	return <Loader />;
    }

    return (
    	<div className="mx-auto w-full mt-10 max-w-md p-6">
    		<h1 className="mb-6 text-center text-3xl font-bold">Create Account</h1>

    		<form
    			onSubmit={(e) => {
    				e.preventDefault();
    				e.stopPropagation();
    				form.handleSubmit();
    			}}
    			className="space-y-4"
    		>
    			<div>
    				<form.Field name="name">
    					{(field) => (
    						<div className="space-y-2">
    							<Label htmlFor={field.name}>Name</Label>
    							<Input
    								id={field.name}
    								name={field.name}
    								value={field.state.value}
    								onBlur={field.handleBlur}
    								onChange={(e) => field.handleChange(e.target.value)}
    							/>
    							{field.state.meta.errors.map((error) => (
    								<p key={error?.message} className="text-red-500">
    									{error?.message}
    								</p>
    							))}
    						</div>
    					)}
    				</form.Field>
    			</div>

    			<div>
    				<form.Field name="email">
    					{(field) => (
    						<div className="space-y-2">
    							<Label htmlFor={field.name}>Email</Label>
    							<Input
    								id={field.name}
    								name={field.name}
    								type="email"
    								value={field.state.value}
    								onBlur={field.handleBlur}
    								onChange={(e) => field.handleChange(e.target.value)}
    							/>
    							{field.state.meta.errors.map((error) => (
    								<p key={error?.message} className="text-red-500">
    									{error?.message}
    								</p>
    							))}
    						</div>
    					)}
    				</form.Field>
    			</div>

    			<div>
    				<form.Field name="password">
    					{(field) => (
    						<div className="space-y-2">
    							<Label htmlFor={field.name}>Password</Label>
    							<Input
    								id={field.name}
    								name={field.name}
    								type="password"
    								value={field.state.value}
    								onBlur={field.handleBlur}
    								onChange={(e) => field.handleChange(e.target.value)}
    							/>
    							{field.state.meta.errors.map((error) => (
    								<p key={error?.message} className="text-red-500">
    									{error?.message}
    								</p>
    							))}
    						</div>
    					)}
    				</form.Field>
    			</div>

    			<form.Subscribe>
    				{(state) => (
    					<Button
    						type="submit"
    						className="w-full"
    						disabled={!state.canSubmit || state.isSubmitting}
    					>
    						{state.isSubmitting ? "Submitting..." : "Sign Up"}
    					</Button>
    				)}
    			</form.Subscribe>
    		</form>

    		<div className="mt-4 text-center">
    			<Button
    				variant="link"
    				onClick={onSwitchToSignIn}
    				className="text-indigo-600 hover:text-indigo-800"
    			>
    				Already have an account? Sign In
    			</Button>
    		</div>
    	</div>
    );

}
</file>
<file name="user-menu.tsx" path="/apps/web/src/components/user-menu.tsx">
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuLabel,
DropdownMenuSeparator,
DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Link } from "@tanstack/react-router";

export default function UserMenu() {
const navigate = useNavigate();
const { data: session, isPending } = authClient.useSession();

    if (isPending) {
    	return <Skeleton className="h-9 w-24" />;
    }

    if (!session) {
    	return (
    		<Button variant="outline" asChild>
    			<Link to="/login">Sign In</Link>
    		</Button>
    	);
    }

    return (
    	<DropdownMenu>
    		<DropdownMenuTrigger asChild>
    			<Button variant="outline">{session.user.name}</Button>
    		</DropdownMenuTrigger>
    		<DropdownMenuContent className="bg-card">
    			<DropdownMenuLabel>My Account</DropdownMenuLabel>
    			<DropdownMenuSeparator />
    			<DropdownMenuItem>{session.user.email}</DropdownMenuItem>
    			<DropdownMenuItem asChild>
    				<Button
    					variant="destructive"
    					className="w-full"
    					onClick={() => {
    						authClient.signOut({
    							fetchOptions: {
    								onSuccess: () => {
    									navigate({
    										to: "/",
    									});
    								},
    							},
    						});
    					}}
    				>
    					Sign Out
    				</Button>
    			</DropdownMenuItem>
    		</DropdownMenuContent>
    	</DropdownMenu>
    );

}
</file>
<file name="auth-client.ts" path="/apps/web/src/lib/auth-client.ts">
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
baseURL: import.meta.env.VITE_SERVER_URL,
});
</file>
<file name="utils.ts" path="/apps/web/src/lib/utils.ts">
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
return twMerge(clsx(inputs));
}
</file>
<file name="__root.tsx" path="/apps/web/src/routes/__root.tsx">
import { Toaster } from "@/components/ui/sonner";

import {
HeadContent,
Outlet,
Scripts,
createRootRouteWithContext,
useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Header from "../components/header";
import appCss from "../index.css?url";
import Loader from "@/components/loader";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
head: () => ({
meta: [
{
charSet: "utf-8",
},
{
name: "viewport",
content: "width=device-width, initial-scale=1",
},
{
title: "My App",
},
],
links: [
{
rel: "stylesheet",
href: appCss,
},
],
}),

    component: RootDocument,

});

function RootDocument() {
const isFetching = useRouterState({ select: (s) => s.isLoading });
return (
<html lang="en" className="dark">
<head>
<HeadContent />
</head>
<body>
<div className="grid h-svh grid-rows-[auto_1fr]">
<Header />
{isFetching ? <Loader /> : <Outlet />}
</div>
<Toaster richColors />
<TanStackRouterDevtools position="bottom-left" />
<Scripts />
</body>
</html>
);
}
</file>
<file name="dashboard.tsx" path="/apps/web/src/routes/dashboard.tsx">
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
component: RouteComponent,
beforeLoad: async () => {
const session = await authClient.getSession();
if (!session.data) {
redirect({
to: "/login",
throw: true,
});
}
return { session };
},
});

function RouteComponent() {
const { session } = Route.useRouteContext();

    return (
    	<div>
    		<h1>Dashboard</h1>
    		<p>Welcome {session.data?.user.name}</p>
    	</div>
    );

}
</file>
<file name="index.tsx" path="/apps/web/src/routes/index.tsx">
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
component: HomeComponent,
});

const TITLE_TEXT = `
██████╗ ███████╗████████╗████████╗███████╗██████╗
██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
██████╔╝█████╗ ██║ ██║ █████╗ ██████╔╝
██╔══██╗██╔══╝ ██║ ██║ ██╔══╝ ██╔══██╗
██████╔╝███████╗ ██║ ██║ ███████╗██║ ██║
╚═════╝ ╚══════╝ ╚═╝ ╚═╝ ╚══════╝╚═╝ ╚═╝

████████╗ ███████╗████████╗ █████╗ ██████╗██╗ ██╗
╚══██╔══╝ ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
██║ ███████╗ ██║ ███████║██║ █████╔╝
██║ ╚════██║ ██║ ██╔══██║██║ ██╔═██╗
██║ ███████║ ██║ ██║ ██║╚██████╗██║ ██╗
╚═╝ ╚══════╝ ╚═╝ ╚═╝ ╚═╝ ╚═════╝╚═╝ ╚═╝
`;

function HomeComponent() {
return (
<div className="container mx-auto max-w-3xl px-4 py-2">
<pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
<div className="grid gap-6">
<section className="rounded-lg border p-4">
<h2 className="mb-2 font-medium">API Status</h2>
</section>
</div>
</div>
);
}
</file>
<file name="login.tsx" path="/apps/web/src/routes/login.tsx">
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/login")({
component: RouteComponent,
});

function RouteComponent() {
const [showSignIn, setShowSignIn] = useState(false);

    return showSignIn ? (
    	<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
    ) : (
    	<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
    );

}
</file>
<file name="index.css" path="/apps/web/src/index.css">
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:where(.dark, .dark \*));

@theme {
--font-sans: "Inter", "Geist", ui-sans-serif, system-ui, sans-serif,
"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}

html,
body {
@apply bg-white dark:bg-gray-950;

@media (prefers-color-scheme: dark) {
color-scheme: dark;
}
}

:root {
--radius: 0.625rem;
--background: oklch(1 0 0);
--foreground: oklch(0.145 0 0);
--card: oklch(1 0 0);
--card-foreground: oklch(0.145 0 0);
--popover: oklch(1 0 0);
--popover-foreground: oklch(0.145 0 0);
--primary: oklch(0.205 0 0);
--primary-foreground: oklch(0.985 0 0);
--secondary: oklch(0.97 0 0);
--secondary-foreground: oklch(0.205 0 0);
--muted: oklch(0.97 0 0);
--muted-foreground: oklch(0.556 0 0);
--accent: oklch(0.97 0 0);
--accent-foreground: oklch(0.205 0 0);
--destructive: oklch(0.577 0.245 27.325);
--border: oklch(0.922 0 0);
--input: oklch(0.922 0 0);
--ring: oklch(0.708 0 0);
--chart-1: oklch(0.646 0.222 41.116);
--chart-2: oklch(0.6 0.118 184.704);
--chart-3: oklch(0.398 0.07 227.392);
--chart-4: oklch(0.828 0.189 84.429);
--chart-5: oklch(0.769 0.188 70.08);
--sidebar: oklch(0.985 0 0);
--sidebar-foreground: oklch(0.145 0 0);
--sidebar-primary: oklch(0.205 0 0);
--sidebar-primary-foreground: oklch(0.985 0 0);
--sidebar-accent: oklch(0.97 0 0);
--sidebar-accent-foreground: oklch(0.205 0 0);
--sidebar-border: oklch(0.922 0 0);
--sidebar-ring: oklch(0.708 0 0);
}

.dark {
--background: oklch(0.145 0 0);
--foreground: oklch(0.985 0 0);
--card: oklch(0.205 0 0);
--card-foreground: oklch(0.985 0 0);
--popover: oklch(0.205 0 0);
--popover-foreground: oklch(0.985 0 0);
--primary: oklch(0.922 0 0);
--primary-foreground: oklch(0.205 0 0);
--secondary: oklch(0.269 0 0);
--secondary-foreground: oklch(0.985 0 0);
--muted: oklch(0.269 0 0);
--muted-foreground: oklch(0.708 0 0);
--accent: oklch(0.269 0 0);
--accent-foreground: oklch(0.985 0 0);
--destructive: oklch(0.704 0.191 22.216);
--border: oklch(1 0 0 / 10%);
--input: oklch(1 0 0 / 15%);
--ring: oklch(0.556 0 0);
--chart-1: oklch(0.488 0.243 264.376);
--chart-2: oklch(0.696 0.17 162.48);
--chart-3: oklch(0.769 0.188 70.08);
--chart-4: oklch(0.627 0.265 303.9);
--chart-5: oklch(0.645 0.246 16.439);
--sidebar: oklch(0.205 0 0);
--sidebar-foreground: oklch(0.985 0 0);
--sidebar-primary: oklch(0.488 0.243 264.376);
--sidebar-primary-foreground: oklch(0.985 0 0);
--sidebar-accent: oklch(0.269 0 0);
--sidebar-accent-foreground: oklch(0.985 0 0);
--sidebar-border: oklch(1 0 0 / 10%);
--sidebar-ring: oklch(0.556 0 0);
}

@theme inline {
--radius-sm: calc(var(--radius) - 4px);
--radius-md: calc(var(--radius) - 2px);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
--color-background: var(--background);
--color-foreground: var(--foreground);
--color-card: var(--card);
--color-card-foreground: var(--card-foreground);
--color-popover: var(--popover);
--color-popover-foreground: var(--popover-foreground);
--color-primary: var(--primary);
--color-primary-foreground: var(--primary-foreground);
--color-secondary: var(--secondary);
--color-secondary-foreground: var(--secondary-foreground);
--color-muted: var(--muted);
--color-muted-foreground: var(--muted-foreground);
--color-accent: var(--accent);
--color-accent-foreground: var(--accent-foreground);
--color-destructive: var(--destructive);
--color-border: var(--border);
--color-input: var(--input);
--color-ring: var(--ring);
--color-chart-1: var(--chart-1);
--color-chart-2: var(--chart-2);
--color-chart-3: var(--chart-3);
--color-chart-4: var(--chart-4);
--color-chart-5: var(--chart-5);
--color-sidebar: var(--sidebar);
--color-sidebar-foreground: var(--sidebar-foreground);
--color-sidebar-primary: var(--sidebar-primary);
--color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
--color-sidebar-accent: var(--sidebar-accent);
--color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
--color-sidebar-border: var(--sidebar-border);
--color-sidebar-ring: var(--sidebar-ring);
}

@layer base {

- {
  @apply border-border outline-ring/50;
  }
  body {
  @apply bg-background text-foreground;
  }
  }
  </file>
  <file name="router.tsx" path="/apps/web/src/router.tsx">
  import { createRouter as createTanStackRouter } from "@tanstack/react-router";
  import Loader from "./components/loader";
  import "./index.css";
  import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
const router = createTanStackRouter({
routeTree,
scrollRestoration: true,
defaultPreloadStaleTime: 0,
context: {},
defaultPendingComponent: () => <Loader />,
defaultNotFoundComponent: () => <div>Not Found</div>,
Wrap: ({ children }) => <>{children}</>,
});
return router;
};

declare module "@tanstack/react-router" {
interface Register {
router: ReturnType<typeof getRouter>;
}
}
</file>
<file name=".gitignore" path="/apps/web/.gitignore">

# Dependencies

/node_modules
/.pnp
.pnp._
.yarn/_
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# Testing

/coverage

# Build outputs

/.next/
/out/
/build/
/dist/
.vinxi
.output
.react-router/
.tanstack/
.nitro/

# Deployment

.vercel
.netlify
.wrangler
.alchemy

# Environment & local files

.env*
!.env.example
.DS_Store
*.pem
\*.local

# Logs

npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
_.log_

# TypeScript

\*.tsbuildinfo
next-env.d.ts

# IDE

.vscode/\*
!.vscode/extensions.json
.idea

# Other

dev-dist

.wrangler
.dev.vars\*

.open-next
</file>
<file name="components.json" path="/apps/web/components.json">
{
"$schema": "https://ui.shadcn.com/schema.json",
"style": "new-york",
"rsc": false,
"tsx": true,
"tailwind": {
"config": "",
"css": "src/index.css",
"baseColor": "neutral",
"cssVariables": true,
"prefix": ""
},
"aliases": {
"components": "@/components",
"utils": "@/lib/utils",
"ui": "@/components/ui",
"lib": "@/lib",
"hooks": "@/hooks"
},
"iconLibrary": "lucide"
}
</file>
<file name="package.json" path="/apps/web/package.json">
{
"name": "web",
"private": true,
"type": "module",
"scripts": {
"build": "vite build",
"serve": "vite preview",
"dev": "vite dev --port=3001"
},
"dependencies": {
"radix-ui": "^1.4.3",
"@tanstack/react-form": "^1.23.4",
"@tailwindcss/vite": "^4.1.13",
"@tanstack/react-query": "^5.90.2",
"@tanstack/react-router": "^1.132.7",
"@tanstack/react-router-with-query": "^1.130.17",
"@tanstack/react-start": "^1.132.10",
"@tanstack/router-plugin": "^1.132.7",
"class-variance-authority": "^0.7.1",
"clsx": "^2.1.1",
"lucide-react": "^0.544.0",
"next-themes": "^0.4.6",
"react": "19.1.1",
"react-dom": "19.1.1",
"sonner": "^2.0.7",
"tailwindcss": "^4.1.13",
"tailwind-merge": "^3.3.1",
"tw-animate-css": "^1.4.0",
"vite-tsconfig-paths": "^5.1.4",
"zod": "^4.1.11",
"better-auth": "^1.3.18"
},
"devDependencies": {
"@tanstack/react-router-devtools": "^1.132.7",
"@testing-library/dom": "^10.4.1",
"@testing-library/react": "^16.3.0",
"@types/react": "~19.1.14",
"@types/react-dom": "^19.1.9",
"@vitejs/plugin-react": "^5.0.3",
"jsdom": "^27.0.0",
"typescript": "^5.9.2",
"vite": "^7.1.7",
"web-vitals": "^5.1.0",
"@tanstack/react-query-devtools": "^5.90.2"
}
}
</file>
<file name="tsconfig.json" path="/apps/web/tsconfig.json">
{
"include": ["**/*.ts", "**/*.tsx"],
"compilerOptions": {
"target": "ES2022",
"jsx": "react-jsx",
"module": "ESNext",
"lib": ["ES2022", "DOM", "DOM.Iterable"],
"types": ["vite/client"],

    	/* Bundler mode */
    	"moduleResolution": "bundler",
    	"allowImportingTsExtensions": true,
    	"verbatimModuleSyntax": true,
    	"noEmit": true,

    	/* Linting */
    	"skipLibCheck": true,
    	"strict": true,
    	"noUnusedLocals": true,
    	"noUnusedParameters": true,
    	"noFallthroughCasesInSwitch": true,
    	"noUncheckedSideEffectImports": true,
    	"baseUrl": ".",
    	"paths": {
    		"@/*": ["./src/*"]
    	}
    },
    "references": [
    	{
    		"path": "../server"
    	}
    ]

}
</file>
<file name="vite.config.ts" path="/apps/web/vite.config.ts">
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
plugins: [
tsconfigPaths(),
tailwindcss(),
tanstackStart({ customViteReactPlugin: true }),
viteReact(),
],
});
</file>
<file name=".oxlintrc.json" path="/.oxlintrc.json">
{
"plugins": [
"unicorn",
"typescript",
"oxc"
],
"categories": {},
"rules": {
"for-direction": "warn",
"no-async-promise-executor": "warn",
"no-caller": "warn",
"no-class-assign": "warn",
"no-compare-neg-zero": "warn",
"no-cond-assign": "warn",
"no-const-assign": "warn",
"no-constant-binary-expression": "warn",
"no-constant-condition": "warn",
"no-control-regex": "warn",
"no-debugger": "warn",
"no-delete-var": "warn",
"no-dupe-class-members": "warn",
"no-dupe-else-if": "warn",
"no-dupe-keys": "warn",
"no-duplicate-case": "warn",
"no-empty-character-class": "warn",
"no-empty-pattern": "warn",
"no-empty-static-block": "warn",
"no-eval": "warn",
"no-ex-assign": "warn",
"no-extra-boolean-cast": "warn",
"no-func-assign": "warn",
"no-global-assign": "warn",
"no-import-assign": "warn",
"no-invalid-regexp": "warn",
"no-irregular-whitespace": "warn",
"no-loss-of-precision": "warn",
"no-new-native-nonconstructor": "warn",
"no-nonoctal-decimal-escape": "warn",
"no-obj-calls": "warn",
"no-self-assign": "warn",
"no-setter-return": "warn",
"no-shadow-restricted-names": "warn",
"no-sparse-arrays": "warn",
"no-this-before-super": "warn",
"no-unassigned-vars": "warn",
"no-unsafe-finally": "warn",
"no-unsafe-negation": "warn",
"no-unsafe-optional-chaining": "warn",
"no-unused-labels": "warn",
"no-unused-private-class-members": "warn",
"no-unused-vars": "warn",
"no-useless-backreference": "warn",
"no-useless-catch": "warn",
"no-useless-escape": "warn",
"no-useless-rename": "warn",
"no-with": "warn",
"require-yield": "warn",
"use-isnan": "warn",
"valid-typeof": "warn",
"oxc/bad-array-method-on-arguments": "warn",
"oxc/bad-char-at-comparison": "warn",
"oxc/bad-comparison-sequence": "warn",
"oxc/bad-min-max-func": "warn",
"oxc/bad-object-literal-comparison": "warn",
"oxc/bad-replace-all-arg": "warn",
"oxc/const-comparisons": "warn",
"oxc/double-comparisons": "warn",
"oxc/erasing-op": "warn",
"oxc/missing-throw": "warn",
"oxc/number-arg-out-of-range": "warn",
"oxc/only-used-in-recursion": "warn",
"oxc/uninvoked-array-callback": "warn",
"typescript/await-thenable": "warn",
"typescript/no-array-delete": "warn",
"typescript/no-base-to-string": "warn",
"typescript/no-duplicate-enum-values": "warn",
"typescript/no-duplicate-type-constituents": "warn",
"typescript/no-extra-non-null-assertion": "warn",
"typescript/no-floating-promises": "warn",
"typescript/no-for-in-array": "warn",
"typescript/no-implied-eval": "warn",
"typescript/no-meaningless-void-operator": "warn",
"typescript/no-misused-new": "warn",
"typescript/no-misused-spread": "warn",
"typescript/no-non-null-asserted-optional-chain": "warn",
"typescript/no-redundant-type-constituents": "warn",
"typescript/no-this-alias": "warn",
"typescript/no-unnecessary-parameter-property-assignment": "warn",
"typescript/no-unsafe-declaration-merging": "warn",
"typescript/no-unsafe-unary-minus": "warn",
"typescript/no-useless-empty-export": "warn",
"typescript/no-wrapper-object-types": "warn",
"typescript/prefer-as-const": "warn",
"typescript/require-array-sort-compare": "warn",
"typescript/restrict-template-expressions": "warn",
"typescript/triple-slash-reference": "warn",
"typescript/unbound-method": "warn",
"unicorn/no-await-in-promise-methods": "warn",
"unicorn/no-empty-file": "warn",
"unicorn/no-invalid-fetch-options": "warn",
"unicorn/no-invalid-remove-event-listener": "warn",
"unicorn/no-new-array": "warn",
"unicorn/no-single-promise-in-promise-methods": "warn",
"unicorn/no-thenable": "warn",
"unicorn/no-unnecessary-await": "warn",
"unicorn/no-useless-fallback-in-spread": "warn",
"unicorn/no-useless-length-check": "warn",
"unicorn/no-useless-spread": "warn",
"unicorn/prefer-set-size": "warn",
"unicorn/prefer-string-starts-ends-with": "warn"
},
"settings": {
"jsx-a11y": {
"polymorphicPropName": null,
"components": {},
"attributes": {}
},
"next": {
"rootDir": []
},
"react": {
"formComponents": [],
"linkComponents": []
},
"jsdoc": {
"ignorePrivate": false,
"ignoreInternal": false,
"ignoreReplacesDocs": true,
"overrideReplacesDocs": true,
"augmentsExtendsReplacesDocs": false,
"implementsReplacesDocs": false,
"exemptDestructuredRootsFromChecks": false,
"tagNamePreference": {}
}
},
"env": {
"builtin": true
},
"globals": {},
"ignorePatterns": []
}
</file>
<file name="biome.json" path="/biome.json">
{
"$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
"files": {
"ignoreUnknown": false,
"includes": [
"**",
"!**/.next",
"!**/dist",
"!**/.turbo",
"!**/dev-dist",
"!**/.zed",
"!**/.vscode",
"!**/routeTree.gen.ts",
"!**/src-tauri",
"!**/.nuxt",
"!bts.jsonc",
"!**/.expo",
"!**/.wrangler",
"!**/.alchemy",
"!**/.svelte-kit",
"!**/wrangler.jsonc",
"!**/.source"
]
},
"extends": [
"ultracite"
]
}
</file>
<file name="bts.jsonc" path="/bts.jsonc">
// Better-T-Stack configuration file
// safe to delete

{
"$schema": "https://r2.better-t-stack.dev/schema.json",
"version": "2.49.0",
"createdAt": "2025-09-26T19:27:43.672Z",
"database": "sqlite",
"orm": "drizzle",
"backend": "hono",
"runtime": "bun",
"frontend": [
"tanstack-start"
],
"addons": [
"husky",
"oxlint",
"ruler",
"turborepo",
"ultracite"
],
"examples": [],
"auth": "better-auth",
"packageManager": "bun",
"dbSetup": "none",
"api": "none",
"webDeploy": "none",
"serverDeploy": "none"
}
</file>
<file name="bunfig.toml" path="/bunfig.toml">
[install]
linker = "isolated"
</file>
<file name="package.json" path="/package.json">
{
"name": "broken-start",
"private": true,
"type": "module",
"workspaces": [
"apps/*",
"packages/*"
],
"scripts": {
"check": "oxlint",
"ruler:apply": "bunx @intellectronica/ruler@latest apply --local-only",
"dev": "turbo dev",
"build": "turbo build",
"check-types": "turbo check-types",
"dev:native": "turbo -F native dev",
"dev:web": "turbo -F web dev",
"dev:server": "turbo -F server dev",
"db:push": "turbo -F server db:push",
"db:studio": "turbo -F server db:studio",
"db:generate": "turbo -F server db:generate",
"db:migrate": "turbo -F server db:migrate"
},
"dependencies": {},
"devDependencies": {
"turbo": "^2.5.8",
"@biomejs/biome": "2.2.4",
"ultracite": "5.4.5",
"husky": "^9.1.7",
"lint-staged": "^16.2.1",
"oxlint": "^1.18.0"
},
"lint-staged": {
"\*.{js,jsx,ts,tsx,json,jsonc,css,scss,md,mdx}": [
"bun x ultracite fix"
]
},
"packageManager": "bun@1.2.22"
}
</file>
<file name="README.md" path="/README.md">

# broken-start

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Hono, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Hono** - Lightweight, performant server framework
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **SQLite/Turso** - Database engine
- **Authentication** - Better-Auth
- **Husky** - Git hooks for code quality
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses SQLite with Drizzle ORM.

1. Start the local SQLite database:

```bash
cd apps/server && bun db:local
```

2. Update your `.env` file in the `apps/server` directory with the appropriate connection details if needed.

3. Apply the schema to your database:

```bash
bun db:push
```

Then, run the development server:

```bash
bun dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
broken-start/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Start)
│   └── server/      # Backend API (Hono)
```

## Available Scripts

- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun dev:web`: Start only the web application
- `bun dev:server`: Start only the server
- `bun check-types`: Check TypeScript types across all apps
- `bun db:push`: Push schema changes to database
- `bun db:studio`: Open database studio UI
- `cd apps/server && bun db:local`: Start the local SQLite database
  </file>
  <file name="tsconfig.json" path="/tsconfig.json">
  {
  "compilerOptions": {
  "strictNullChecks": true
  }
  }
  </file>
  <file name="turbo.json" path="/turbo.json">
  {
  "$schema": "https://turbo.build/schema.json",
	"ui": "tui",
	"tasks": {
		"build": {
			"dependsOn": ["^build"],
			"inputs": ["$TURBO_DEFAULT$", ".env\*"],
  "outputs": ["dist/**"]
  },
  "lint": {
  "dependsOn": ["^lint"]
  },
  "check-types": {
  "dependsOn": ["^check-types"]
  },
  "dev": {
  "cache": false,
  "persistent": true
  },
  "db:push": {
  "cache": false,
  "persistent": true
  },
  "db:studio": {
  "cache": false,
  "persistent": true
  },
  "db:migrate": {
  "cache": false,
  "persistent": true
  },
  "db:generate": {
  "cache": false,
  "persistent": true
  }
  }
  }
  </file>
  </project_files>
  </context>
