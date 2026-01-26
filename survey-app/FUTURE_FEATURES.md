# Future Features

A list of features to consider for future development.

## Survey Management

### Edit Survey
Allow survey creators to edit existing surveys after creation.

**Requirements:**
- Pre-populate the create form with existing survey data
- Handle slug changes (redirect old URLs or prevent slug edits)
- Consider how to handle existing responses when questions change
- Option to version surveys vs. update in-place

**Complexity:** Medium-High (create page is ~920 lines)

**Workaround:** Users can delete and recreate surveys (loses existing responses)

---

## Other Ideas

- Social sharing buttons (Twitter, Facebook, LinkedIn)
- QR code generation for survey links
- Password-protected surveys
- Email allowlist for survey access
- Survey templates
- Duplicate/clone survey feature
