# Certificate image review, resume update, and security coverage

## What will change

- Add an admin-only certificate image workflow to the existing certificate page: upload and preview, AI extraction of issuer/recipient/issue date with confidence, deterministic inconsistency flags, editable extracted fields, and approve/reject review states.
- Keep uploaded certificate images in a private Cloud Storage bucket, record review metadata and status in an admin-only database table, and audit analysis and review decisions. Enforce image type/size limits, server-side admin checks, and rate limiting before analysis.
- Use the available `openai/gpt-6-astra` model through the server-side Lovable AI Gateway. Treat extraction as assistive: low confidence, missing/impossible dates, and recipient-name differences are flagged for human review; AI output never verifies authenticity.
- Add security integration tests using normal-user and administrator fixtures for audit export, PDF certificate validation, and private certificate preview. Exercise conditional 304, range 206, unsatisfiable 416, authorization-before-cache behavior, and cross-user cache isolation.
- Update the site’s resume data from the uploaded PDF only after the requested facts are settled. The file says CGPA 9.61 and includes additional projects, which conflicts with the saved portfolio facts (9.68 and a fixed four-project list).
- Document the endpoint contract, review behavior, security controls, test matrix, and rollout/rollback notes.

## Implementation outline

1. Add an additive `certificate_reviews` table with admin-only RLS and explicit grants, plus policies for the private image bucket.
2. Add authenticated analyze/list/update handlers and a server-only structured, streamed AI Gateway extraction path; never expose the gateway key or trust client MIME, identity, or model output.
3. Extend the admin certificate UI with upload, thumbnail, review fields, discrepancy warnings, and explicit approve/reject actions.
4. Tighten private preview authorization and introduce reusable injectable route seams for normal/admin integration fixtures; keep private responses `private, no-store` and authorize before returning validators or bytes.
5. Add regression tests and technical handoff notes, then run the focused suite and project verification.

## Technical details

- Image input: PNG, JPEG, or WebP, magic-byte checked, with an 8 MB request ceiling and account-based rate limit.
- AI response: strict JSON fields for issuer, recipient, issue date, confidence per field, and observed text. Deterministic checks compare recipient to the portfolio owner and flag missing/future dates or confidence below the review threshold.
- Review records retain corrected fields, flags, status, reviewer, timestamps, image path, and content digest. Browser previews use short-lived signed URLs; no certificate image is publicly addressable.
- Private certificate artifacts are admin-readable; public artifacts retain their existing public behavior. Authentication and authorization must happen before ETag and range decisions.

## Pending user choice

The resume update depends on whether the uploaded PDF should replace the saved 9.68 CGPA/four-project portfolio facts or preserve them. No conflicting resume facts will be changed until the user answers.