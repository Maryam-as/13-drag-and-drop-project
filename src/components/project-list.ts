/// <reference path='base-component.ts' />
/// <reference path='../models/drag-drop.ts'/>
/// <reference path='../models/project.ts'/>
/// <reference path='../state/project-state.ts'/>
/// <reference path='../decorators/autobind.ts'/>

namespace App {
  /**
   * ProjectList class
   */
  export class ProjectList
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
}
