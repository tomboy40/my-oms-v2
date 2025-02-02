# [Cursor Prompting HandBook](https://twitter-thread.com/t/1873417505550868647)

1. "Fix Errors" Prompt 
> @page.tsx I got this error
> 
> Use Chain of thoughts reasoning to find the core issue of this error, then create a step by step plan to fix the error.

2. "New feature" Prompt
> Great. Header looks good
>
> Now we move to "x" section, Refer to @frontend-guidelines.md to understand the scope of work for this feature.
> 
> Before implementation if you need more clarification or have any questions, ask me!

3. Response structure:
> Header menu is now aligned in center perfectly.
>
> Check @frontend-guidelines.md and explain how you will implement this.

4. progress.md file
> At the end of every completed step record your work log in @Progress.md file. What features we implemented? What errors we encountered? How did we fixed all those errors.
> 
> Answer these 3 questions in a step by step manner and DO NOT miss any information.

5. project-status.md file
> At the end of the session record your work log in @project-status.md file.
>
> First check @progress.md file to understand all the features we have implemented in this session.
> 
> Then write a detailed session report which should provide detailed context for next work session

6. Cursor Agent Hack
> Read instructions in @(document name) to understand the scope of work for this feature.
> 
> Use chain of thought reasoning to create a step by step implementation plan.
>
> Ensure you explain how every section of this feature works providing macro-level details.
>
> Break these items into detailed numbered steps.

7. Attach Documents. 
> - Project Requirements Doc (PRD)
> - App Flow Doc
> - Frontent Guidelines Doc
> - Backend Structure Doc
> - Tech Stack Doc
> - File Structure Doc

# Documents
1. Cursorrules file & Rules for AI

Cursor scans Rules for AI and .cursorrules file the first so we need to fill up these first. 

Rules for AI: This is general settings about your coding workflow. (for every project this can stay the same if you use same tach stack)

.cursorrules file: This is project specific instructions file. Take inspirations from cursor .directory site.

2. Project Requirements Document (PRD)

This is the most important document for for AI coding project.

This doc provides the summary of all aspects of the project like:
- Introduction
- App flow
- Core features
- Tech Stack
- In scope vs out of scope

3. App Flow
User start its journey from landing page then clicks on sign up button and sign up with Google and then land on dashboard. Dashboard has............ sections.

2. Tech Stack
This document should provide all technical details about the project like:
- Frontend Tech Stack
- Backend Tech Stack
- API iIntegrations
- Deployment Instructions

3. Frontend guidelines
This Document should provide all details about how you want your project to look like - visually:
- Deisgn Principles
- Styling Instructions
- Page Layout
- Navigation
- Color Pallates
- Fonts

4. Backend Structure
This Document will explain to AI model about:
- Backend Tech
- User Authentication
- Database Architecture
- Storage buckets
- API Endpoints
- Security measures
- Hosting Solutions

5. Project Status Document
ask AI to update this document after every major feature completion.

