namespace App {
  /**
   * State Base Class
   */
  type Listener<T> = (items: T[]) => void;

  class State<T> {
    protected listeners: Listener<T>[] = [];

    /**
     * addListener
     *
     * Registers a listener function that will be notified whenever
     * the state changes.
     *
     * This allows UI components to "subscribe" to state updates
     * without tightly coupling them to State's internal logic.
     */
    addListener(listenerFn: Listener<T>) {
      this.listeners.push(listenerFn);
    }
  }

  /**
   * Project State Management
   *
   * This class is responsible for managing all project data.
   * It follows the Singleton pattern to ensure there is only one instance
   * of ProjectState across the entire application.
   *
   * In addition to storing projects, this state also implements a simple
   * observer (listener) mechanism so UI components can react to state changes.
   */
  export class ProjectState extends State<Project> {
    // Array to hold all projects
    private projects: Project[] = [];

    // Static property to hold the single instance of ProjectState
    private static instance: ProjectState;

    // Private constructor prevents direct instantiation
    private constructor() {
      super();
    }

    /**
     * getInstance
     *
     * Provides access to the single instance of ProjectState.
     * If an instance already exists, it returns that instance.
     * Otherwise, it creates a new instance and returns it.
     */
    static getInstance() {
      if (this.instance) {
        return this.instance;
      }

      this.instance = new ProjectState();
      return this.instance;
    }

    addProject(title: string, description: string, numOfPeople: number) {
      const newProject = new Project(
        Math.random().toString(),
        title,
        description,
        numOfPeople,
        ProjectStatus.Active
      );

      // Add the newly created project to the internal state array
      this.projects.push(newProject);

      // Notify all registered listeners about the state change.
      this.updateListeners();
    }

    moveProject(projectId: string, newStatus: ProjectStatus) {
      const project = this.projects.find(prj => prj.id === projectId);

      if (project && project.status !== newStatus) {
        project.status = newStatus;

        // Notify all registered listeners about the state change.
        this.updateListeners();
      }
    }

    private updateListeners() {
      // Notify all registered listeners about the state change.
      for (const listenerFn of this.listeners) {
        /**
         * We pass a COPY of the projects array using slice().
         *
         * Why slice()?
         * - slice() creates a shallow copy of the array
         * - This prevents external code from directly mutating the internal
         *   `projects` array stored inside ProjectState
         *
         * Without slice(), a listener could accidentally modify the original
         * state (e.g. push, pop, or reorder projects), which would break
         * predictable state management and lead to hard-to-track bugs.
         *
         * This enforces a one-way data flow:
         * ProjectState (source of truth) → UI listeners (read-only data)
         */
        listenerFn(this.projects.slice());
      }
    }
  }

  // Create or retrieve the single instance of ProjectState
  export const projectState = ProjectState.getInstance();
}
