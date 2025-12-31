// TypeScript-specific reference directive used to include namespace-based types
// since namespaces cannot be imported using standard ES module syntax
/// <reference path='models/drag-drop.ts'/>
/// <reference path='models/project.ts'/>
/// <reference path='project-state.ts'/>
/// <reference path='validation.ts'/>
/// <reference path='decorators/autobind.ts'/>

// Renamed the namespace from DDInterfaces to App and wrapped all application
// code inside the App namespace to solve a TypeScript scoping issue:
//
// Reason:
// - Even though interfaces (Draggable, DragTarget) are exported from
//   drag-drop-interfaces.ts and imported via the reference directive,
//   TypeScript requires that code using those interfaces be in the same
//   namespace to access them directly without additional imports.
// - By creating an App namespace in app.ts and placing all code inside it,
//   we ensure that classes like ProjectItem and ProjectList can implement
//   Draggable and DragTarget interfaces seamlessly.
// - This also keeps all application code logically grouped under a single
//   namespace, preventing global scope pollution and avoiding naming collisions.
//
// Notes:
// - TypeScript namespaces (with `export`) allow types to be shared across
//   files, but runtime code must also be wrapped in the same namespace if
//   it directly references those types.
// - This pattern is especially useful in non-module or legacy TypeScript
//   projects that use /// <reference path="..."> directives.
namespace App {
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
      // Clean up any remaining drop-target visual indicators.
      document
        .querySelectorAll('.droppable')
        .forEach(el => el.classList.remove('droppable'));
    }

    configure(): void {
      this.element.addEventListener('dragstart', this.dragStartHandler);
      this.element.addEventListener('dragend', this.dragEndHandler);
    }

    renderContent(): void {
      this.element.querySelector('h2')!.textContent = this.project.title;
      this.element.querySelector('h3')!.textContent =
        this.persons + ' assigned';
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

      // Determine the new status based on the type of this ProjectList.
      //
      // `this.type` is provided via the constructor ('active' | 'finished')
      // and represents the semantic role of the list that received the drop.
      //
      // - Dropping on the "active" list moves the project to Active
      // - Dropping on the "finished" list moves the project to Finished
      //
      // This keeps the drop logic generic and reusable: the same handler
      // works for both lists without hard-coding statuses.
      projectState.moveProject(
        prjId,
        this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished
      );
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
  new ProjectInput();

  new ProjectList('active');
  new ProjectList('finished');
}
