# Project Architecture Rules

- Lovable Cloud is the canonical backend; keep database schema, RLS, authentication, and storage aligned with the generated Cloud client because all persistent app features depend on one managed backend.
- User roles live only in `user_roles` and authorization is enforced by database policies because client-side role state is not a security boundary.
- Media buckets are private and files must be displayed through time-limited signed URLs because this workspace blocks public buckets.
