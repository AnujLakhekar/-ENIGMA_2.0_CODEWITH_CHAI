# Convex Configuration & Authentication

This project uses Convex as the backend with Clerk for authentication.

## Authentication Setup

### 1. Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
CLERK_SECRET_KEY=sk_test_YOUR_KEY
CLERK_DOMAIN=your-domain.clerk.accounts.com
CLERK_ISSUER_URL=https://your-domain.clerk.accounts.com
CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

### 2. Clerk Webhook Configuration

Add a webhook to Clerk Dashboard:
- **URL**: `https://YOUR_DEPLOYMENT.convex.cloud/clerk-users-webhook`
- **Events**: `user.created`, `user.updated`, `user.deleted`

### 3. How Authentication Works

1. **User Creation**: When a user signs up in Clerk, a webhook is sent to Convex
2. **User Storage**: Convex stores user data in the `users` table with their Clerk token identifier
3. **Auth Checks**: Protected queries use `getUserIdentity()` to verify the user's token

### 4. Using Authentication in Components

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function UserProfile() {
  const user = useQuery(api.users.getCurrentUser);
  
  return <div>Welcome, {user?.name}!</div>;
}
```

## Convex Functions

### Query Functions (Read-only)
- `getCurrentUser()` - Get the authenticated user
- `getUserById(tokenIdentifier)` - Get user by token identifier

### Mutation Functions (Write operations)
- `createUser(name, email, tokenIdentifier)` - Async user creation (internal only)
- `deleteUser(tokenIdentifier)` - Delete a user (internal only)

## Database Schema

The `users` table has the following structure:
- `name` (string) - User's display name
- `email` (optional string) - User's email
- `tokenIdentifier` (optional string) - Clerk user ID (indexed for fast lookups)

## Welcome to your Convex functions directory!

Write your Convex functions here.
See https://docs.convex.dev/functions for more.

A query function that takes two arguments looks like:

```ts
// convex/myFunctions.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myQueryFunction = query({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Read the database as many times as you need here.
    // See https://docs.convex.dev/database/reading-data.
    const documents = await ctx.db.query("tablename").collect();

    // Arguments passed from the client are properties of the args object.
    console.log(args.first, args.second);

    // Write arbitrary JavaScript here: filter, aggregate, build derived data,
    // remove non-public properties, or create new objects.
    return documents;
  },
});
```

Using this query function in a React component looks like:

```ts
const data = useQuery(api.myFunctions.myQueryFunction, {
  first: 10,
  second: "hello",
});
```

A mutation function looks like:

```ts
// convex/myFunctions.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const myMutationFunction = mutation({
  // Validators for arguments.
  args: {
    first: v.string(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Insert or modify documents in the database here.
    // Mutations can also read from the database like queries.
    // See https://docs.convex.dev/database/writing-data.
    const message = { body: args.first, author: args.second };
    const id = await ctx.db.insert("messages", message);

    // Optionally, return a value from your mutation.
    return await ctx.db.get("messages", id);
  },
});
```

Using this mutation function in a React component looks like:

```ts
const mutation = useMutation(api.myFunctions.myMutationFunction);
function handleButtonPress() {
  // fire and forget, the most common way to use mutations
  mutation({ first: "Hello!", second: "me" });
  // OR
  // use the result once the mutation has completed
  mutation({ first: "Hello!", second: "me" }).then((result) =>
    console.log(result),
  );
}
```

Use the Convex CLI to push your functions to a deployment. See everything
the Convex CLI can do by running `npx convex -h` in your project root
directory. To learn more, launch the docs with `npx convex docs`.
