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
class ProjectState {
  /**
   * Listeners (observer functions)
   *
   * Each listener is a function that will be called whenever the project
   * state changes (e.g. when a new project is added).
   *
   * Typical listeners are UI components (like ProjectList) that need to
   * re-render when the data changes.
   */
  private listeners: any[] = [];

  // Array to hold all projects
  private projects: any[] = [];

  // Static property to hold the single instance of ProjectState
  private static instance: ProjectState;

  // Private constructor prevents direct instantiation
  private constructor() {}

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

  /**
   * addListener
   *
   * Registers a listener function that will be notified whenever
   * the project state changes.
   *
   * This allows UI components to "subscribe" to state updates
   * without tightly coupling them to ProjectState's internal logic.
   */
  addListener(listenerFn: Function) {
    this.listeners.push(listenerFn);
  }

  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = {
      id: Math.random().toString(),
      title,
      description,
      people: numOfPeople,
    };

    // Add the newly created project to the internal state array
    this.projects.push(newProject);

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
 * ProjectList class
 */
class ProjectList {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLElement;

  constructor(private type: 'active' | 'finished') {
    this.templateElement = document.getElementById(
      'project-list'
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById('app')! as HTMLDivElement;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as HTMLElement;
    this.element.id = `${this.type}-projects`;
    this.attach();
    this.renderContent();
  }

  private renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent =
      this.type.toUpperCase() + ' PROJECTS';
  }

  private attach() {
    this.hostElement.insertAdjacentElement('beforeend', this.element);
  }
}

/**
 * ProjectInput class
 */
class ProjectInput {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLFormElement;
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    this.templateElement = document.getElementById(
      'project-input'
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById('app')! as HTMLDivElement;

    // Import the template content into the document (deep clone)
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );

    // Extract the first element from the imported template (the form)
    this.element = importedNode.firstElementChild as HTMLFormElement;

    // Assign an ID to the form for CSS styling
    this.element.id = 'user-input';

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

    // Attach the form to the host element
    this.attach();
  }

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

  private configure() {
    this.element.addEventListener('submit', this.submitHandler);
  }

  // Inserts the form into the DOM at the beginning of the host element
  private attach() {
    this.hostElement.insertAdjacentElement('afterbegin', this.element);
  }
}

// Create an instance to render the project input form
const prjInput = new ProjectInput();

const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');
