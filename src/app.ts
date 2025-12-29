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

  private submitHandler(event: Event) {
    event.preventDefault();

    const title = this.titleInputElement.value;
    const description = this.descriptionInputElement.value;
    const people = this.peopleInputElement.value;

    console.log(title, description, people);
  }

  private configure() {
    this.element.addEventListener('submit', this.submitHandler.bind(this));
  }

  // Inserts the form into the DOM at the beginning of the host element
  private attach() {
    this.hostElement.insertAdjacentElement('afterbegin', this.element);
  }
}

// Create an instance to render the project input form
const prjInput = new ProjectInput();
