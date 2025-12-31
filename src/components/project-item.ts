import { Component } from './base-component.js';
import { type Draggable } from '../models/drag-drop.js';
import { Project } from '../models/project.js';
import { autobind } from '../decorators/autobind.js';

/**
 * ProjectItem class
 */
export class ProjectItem
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
    this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
    this.element.querySelector('p')!.textContent = this.project.description;
  }
}
