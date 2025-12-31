// TypeScript-specific reference directive used to include namespace-based types
// since namespaces cannot be imported using standard ES module syntax
/// <reference path='models/drag-drop.ts'/>
/// <reference path='models/project.ts'/>
/// <reference path='state/project-state.ts'/>
/// <reference path='util/validation.ts'/>
/// <reference path='decorators/autobind.ts'/>
/// <reference path='components/project-input.ts'/>
/// <reference path='components/project-list.ts' />

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
  // Create an instance to render the project input form
  new ProjectInput();
  new ProjectList('active');
  new ProjectList('finished');
}
