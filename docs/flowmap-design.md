## Design Document: Flowmap Feature

### Overview

The Flowmap feature provides a visual representation of the relationships between services and their interfaces within the application. It allows users to search for a specific service and explore its connections to other services. This document outlines the architecture and implementation details of the Flowmap feature, providing context for bug fixing and code refactoring.

### Architecture

The Flowmap feature follows a client-server architecture:

*   **Frontend (React/Remix):** The frontend is responsible for rendering the interactive flow map using the `reactflow` library. It fetches data from the backend API and handles user interactions such as node selection and expansion.
*   **Backend (Remix/Node.js):** The backend provides an API endpoint (`/api/flowmap`) that retrieves service and interface data from the database using Drizzle ORM. It transforms this data into a format suitable for the frontend.

### Data Flow

1. **User Interaction:** The user initiates a search by entering an App ID in the search bar.
2. **API Request:** The frontend sends a request to the `/api/flowmap` endpoint with the search term.
3. **Data Retrieval:** The backend's `searchServicesAndInterfaces` function queries the `itServices` and `interfaces` tables in the database to find the requested service and its connected interfaces.
4. **Data Transformation:** The backend transforms the database results into nodes and edges, where:
    *   Nodes represent services and include information like service name, ID, and status.
    *   Edges represent interfaces between services and include details like status and priority.
5. **API Response:** The backend sends the transformed data back to the frontend.
6. **Rendering:** The frontend uses the `reactflow` library to render the nodes and edges, applying a radial layout to position them.

### Key Components

#### Frontend (`app/components/FlowMap/`)

*   **`index.tsx`:** The main component that integrates `reactflow` and manages the flow map's state and interactions. It uses the following hooks:
    *   **`useGraphState`:** Manages the state of the graph, including nodes, edges, and their visibility.
    *   **`useFlowLayout`:** Calculates and applies the layout of the nodes.
    *   **`useFlowInteractions`:** Handles user interactions with the graph, such as node clicks and drags.
    *   **`useFlowSearch`:** Manages the search functionality within the flow map.
*   **`ServiceNode.tsx`:** Renders individual service nodes, displaying their name, ID, and status. It includes an expand/collapse button for showing connected services.
*   **`InterfaceEdge.tsx`:** Renders the edges representing interfaces between services, including direction indicators and interface counts.
*   **`utils/layoutUtils.ts`:** Contains the `calculateRadialLayout` function, which implements the radial layout algorithm.

#### Backend (`app/routes/api.flowmap.tsx`, `app/models/flowmap.server.ts`)

*   **`app/routes/api.flowmap.tsx`:** The Remix route handler for the `/api/flowmap` endpoint. It receives the search term, calls the `searchServicesAndInterfaces` function, and transforms the data for the frontend.
*   **`app/models/flowmap.server.ts`:** Contains the `searchServicesAndInterfaces` function, which queries the database for services and interfaces based on the search term. It uses Drizzle ORM to interact with the database.

### Data Models (`app/types/flowMap.ts`)

*   **`FlowMapNode`:** Represents a node in the flow map, typically a service.
*   **`FlowMapEdge`:** Represents an edge in the flow map, typically an interface between services.
*   **`GraphState`:**  Interface defining the structure of the flowmap's state, including node hierarchy and visibility.

### Database Interaction

The `searchServicesAndInterfaces` function in `app/models/flowmap.server.ts` performs the following database queries:

1. **Find Interfaces:** Queries the `interfaces` table to find all interfaces where the `sendAppId` or `receivedAppId` matches the search term.
2. **Find Connected Services:** If interfaces are found, it extracts the unique App IDs from the interfaces and queries the `itServices` table to find the corresponding services.
3. **Find Single Service:** If no interfaces are found, it attempts to find a single service in the `itServices` table matching the search term.

### Potential Areas for Bug Fixing and Refactoring

1. **Layout Algorithm:** The current radial layout might become cluttered with a large number of services. Exploring alternative layout algorithms (e.g., force-directed graph) could improve readability.
2. **Performance:** For large deployments, the number of nodes and edges could impact performance. Implementing optimizations like data pagination or virtualization might be necessary.
3. **Error Handling:**  The error handling in the data fetching and transformation logic could be improved to provide more informative error messages to the user.
4. **Placeholder Services:** The logic for creating placeholder services when interfaces exist but services don't could be reviewed for accuracy and completeness.
5. **Visual Clarity:**  Enhancements to the visual representation of nodes and edges, such as different edge styles for different interface types or the ability to filter by status, could improve user understanding.

This design document provides a comprehensive overview of the Flowmap feature's architecture and implementation. It serves as a valuable resource for developers working on bug fixes, code refactoring, or future enhancements.