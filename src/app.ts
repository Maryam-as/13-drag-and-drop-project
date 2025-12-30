/**
 * Drag & Drop Interfaces
 */
// Implemented by elements that can be dragged.
// These methods map directly to the browser's drag events.
interface Draggable {
  /**
   * Triggered when the drag operation starts.
   *
   * Typical use cases:
   * - Store the dragged item's ID in `event.dataTransfer`
   * - Configure allowed drag effects (move, copy, etc.)
   */
  dragStartHandler(event: DragEvent): void;

  /**
   * Triggered when the drag operation ends.
   *
   * Useful for:
   * - Cleaning up visual indicators
   * - Resetting temporary drag-related state
   */
  dragEndHandler(event: DragEvent): void;
}

// Implemented by elements that can receive dropped items.
// These methods control how a drop target reacts during
// the different phases of a drag operation.
interface DragTarget {
  /**
   * Triggered repeatedly while a draggable element is dragged
   * over a valid drop target.
   *
   * Important:
   * - `event.preventDefault()` must be called here
   *   to signal that dropping is allowed.
   * - Often used to add visual feedback (e.g. highlight the target).
   */
  dragOverHandler(event: DragEvent): void;

  /**
   * Triggered when a draggable element is dropped on the target.
   *
   * Typical responsibilities:
   * - Read dragged data from `event.dataTransfer`
   * - Update application state accordingly
   *   (e.g. move a project from Active → Finished)
   */
  dropHandler(event: DragEvent): void;

  /**
   * Triggered when the dragged element leaves the drop target
   * without being dropped.
   *
   * Useful for:
   * - Reverting visual cues added in `dragOverHandler`
   * - Keeping the UI in a consistent state
   */
  dragLeaveHandler(event: DragEvent): void;
}

/**
 * Project Type
 */
enum ProjectStatus {
  Active,
  Finished,
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

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
class ProjectState extends State<Project> {
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

    if (project) {
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
const projectState = ProjectState.getInstance();

/**
 * Validation
 */
interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

function validate(validatableInput: Validatable) {
  let isValid = true;

  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }

  // Only check minLength if it is defined (not null or undefined) and value is a string
  // Using != null is a common pattern to check both null and undefined in TypeScript
  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === 'string'
  ) {
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minLength;
  }

  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === 'string'
  ) {
    isValid =
      isValid && validatableInput.value.length <= validatableInput.maxLength;
  }

  if (
    validatableInput.min != null &&
    typeof validatableInput.value === 'number'
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }

  if (
    validatableInput.max != null &&
    typeof validatableInput.value === 'number'
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }

  return isValid;
}

/**
 * autobind decorator
 */
function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  // Store a reference to the original method
  const originalMethod = descriptor.value;

  const adjustedDescriptor: PropertyDescriptor = {
    configurable: true,
    enumerable: false, // Method should not appear during object enumeration
    // Using a getter ensures the method is bound only when accessed
    get() {
      // 'this' refers to the concrete class instance accessing the method
      // Automatically bind the original method to the current instance
      const boundFn = originalMethod.bind(this);

      return boundFn;
    },
  };

  return adjustedDescriptor;
}

/**
 * Component Base Class
 *
 * A reusable abstract base class for all UI components.
 */
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T;

    // Import the template content into the document (deep clone)
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as U;
    if (newElementId) {
      this.element.id = newElementId;
    }

    this.attach(insertAtStart);
  }

  private attach(insertAtBeginning: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtBeginning ? 'afterbegin' : 'beforeend',
      this.element
    );
  }

  // Forces subclasses to define how the component is configured
  // (e.g. event listeners, state subscriptions).
  abstract configure(): void;

  // Forces subclasses to define how dynamic content
  // (text, lists, data-driven UI) is rendered.
  abstract renderContent(): void;
}

/**
 * ProjectItem class
 */
class ProjectItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable
{
  private project: Project;

  get persons() {
    return this.project.people === 1
      ? '1 person'
      : `${this.project.people} persons`;
  }

  constructor(hostId: string, project: Project) {
    super('single-project', hostId, false, project.id);

    this.project = project;

    this.configure();
    this.renderContent();
  }

  @autobind
  dragStartHandler(event: DragEvent): void {
    // Set the dragged data using the DataTransfer API.
    // Here we store the project's ID so it can be retrieved later
    // when the drop event occurs on a ProjectList.
    event.dataTransfer!.setData('text/plain', this.project.id);

    // Specify the allowed drag effect.
    // 'move' indicates that the dragged element will be moved, not copied.
    event.dataTransfer!.effectAllowed = 'move';
  }

  dragEndHandler(_: DragEvent): void {
    console.log('DragEvent');
  }

  configure(): void {
    this.element.addEventListener('dragstart', this.dragStartHandler);
    this.element.addEventListener('dragend', this.dragEndHandler);
  }

  renderContent(): void {
    this.element.querySelector('h2')!.textContent = this.project.title;
    this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
    this.element.querySelector('p')!.textContent = this.project.description;
  }
}

/**
 * ProjectList class
 */
class ProjectList
  extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget
{
  assignedProjects: Project[];

  constructor(private type: 'active' | 'finished') {
    super('project-list', 'app', false, `${type}-projects`);

    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  @autobind
  dragOverHandler(event: DragEvent): void {
    // Check if the dragged data exists and is of type 'text/plain'
    // This ensures that we only allow drops for items we know how to handle.
    if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
      // MUST call preventDefault() to signal to the browser that dropping
      // is allowed. Without this, the 'drop' event will never fire.
      event.preventDefault();

      // Add a CSS class to the <ul> element to give visual feedback
      // to the user that this is a valid drop target.
      const listEl = this.element.querySelector('ul')!;
      listEl.classList.add('droppable');
    }
  }

  @autobind
  dropHandler(event: DragEvent): void {
    const prjId = event.dataTransfer!.getData('text/plain');
    console.log(prjId);
  }

  @autobind
  dragLeaveHandler(_: DragEvent): void {
    const listEl = this.element.querySelector('ul')!;
    listEl.classList.remove('droppable');
  }

  configure(): void {
    this.element.addEventListener('dragover', this.dragOverHandler);
    this.element.addEventListener('drop', this.dropHandler);
    this.element.addEventListener('dragleave', this.dragLeaveHandler);

    // Register this ProjectList instance as a listener to ProjectState.
    //
    // By subscribing in the constructor, we ensure that as soon as a ProjectList
    // is created, it starts reacting to project state changes.
    // Whenever ProjectState updates (e.g. a new project is added),
    // the listener callback is executed and provides the latest projects data.
    //
    // This keeps ProjectList in sync with the central state and follows
    // a reactive, observer-style architecture where:
    // ProjectState = source of truth
    // ProjectList   = subscriber / observer
    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter(project => {
        if (this.type === 'active') {
          return project.status === ProjectStatus.Active;
        }

        return project.status === ProjectStatus.Finished;
      });
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
  }

  renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent =
      this.type.toUpperCase() + ' PROJECTS';
  }

  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement;

    // Clear the existing list content before rendering to prevent duplicates
    listEl.innerHTML = '';

    for (const prjItem of this.assignedProjects) {
      new ProjectItem(this.element.querySelector('ul')!.id, prjItem);
    }
  }
}

/**
 * ProjectInput class
 */
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    super('project-input', 'app', true, 'user-input');

    this.titleInputElement = this.element.querySelector(
      '#title'
    ) as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      '#description'
    ) as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      '#people'
    ) as HTMLInputElement;

    this.configure();
  }

  configure() {
    this.element.addEventListener('submit', this.submitHandler);
  }

  renderContent(): void {}

  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,
    };

    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5,
    };

    const peopleValidatable: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 5,
    };

    if (
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable)
    ) {
      alert('Invalid input, please try again!');
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }

  private clearInputs() {
    this.titleInputElement.value = '';
    this.descriptionInputElement.value = '';
    this.peopleInputElement.value = '';
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();

    const userInput = this.gatherUserInput();

    // Type guard: ensures userInput is the expected tuple before destructuring
    if (Array.isArray(userInput)) {
      const [title, description, people] = userInput;

      // Add the new project to the centralized ProjectState.
      // This delegates data management to the singleton state class,
      // keeping the UI (ProjectInput) decoupled from how projects are stored.
      projectState.addProject(title, description, people);

      // Reset all form fields to empty strings after successful submission
      this.clearInputs();
    }
  }
}

// Create an instance to render the project input form
const prjInput = new ProjectInput();

const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');
