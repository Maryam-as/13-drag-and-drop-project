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

    if (
      enteredTitle.trim().length === 0 ||
      enteredDescription.trim().length === 0 ||
      enteredPeople.trim().length === 0
    ) {
      alert('Invalid input, please try again!');
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();

    const userInput = this.gatherUserInput();

    // Type guard: ensures userInput is the expected tuple before destructuring
    if (Array.isArray(userInput)) {
      const [title, description, people] = userInput;

      console.log(title, description, people);
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
