// Project model file
// Contains the Project class and ProjectStatus enum.
// Wrapped in the App namespace to match the main application structure
// and allow seamless usage across other files via reference directives.
namespace App {
  export enum ProjectStatus {
    Active,
    Finished,
  }

  export class Project {
    constructor(
      public id: string,
      public title: string,
      public description: string,
      public people: number,
      public status: ProjectStatus
    ) {}
  }
}
