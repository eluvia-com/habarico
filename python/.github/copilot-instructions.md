# Copilot Instructions

**Habarico** is a Python-based web application that allows users to create and manage information systems (or CMS).
The main goal is to provide a user-friendly interface for generating a REST API from Django models and extending it with
schema definitions that describe the data structure and behavior of the CMS application.

## Architecture & Libraries

- The application is built using **Python** and the **Django** framework.
- It is based on the `Django REST framework`, which provides a powerful toolkit for building Web APIs.
- We use **class-based views** and prefer **mixins for reusable functionality**.
- Each object exposed via the API is called a **resource**. A resource provides standard CRUD operations (Create, Read, Update, Delete) and may include **custom actions**.
- Resources expose a schema for both list and detail endpoints. The schema:
  - Defines supported HTTP methods.
  - Describes available views and actions.
  - Is inspired by the OpenAPI specification.
  - Includes only actions and views related to the resource and its objects.
- The main entrypoint for the REST API provides a schema of all resources, their actions, and available views.
  - The schema is simplified and does not include all details of the resources.
- An admin class is used to configure each resource and its schema generator.
  - One admin class = one resource.
  - The admin class defines settings such as serializer, queryset, permissions, available actions, and schema customizations.

## Coding Conventions

- All code must be formatted using **Black**.
- Follow the **PEP 8** style guide for Python code.
- Use **Flake8** for linting.
- Use **type hints** for all API functions and public classes.
- Use **docstrings** for all public functions and classes.
  - Docstring format is inspired by the [Google style guide](https://google.github.io/styleguide/pyguide.html#383-strings-and-comments).
  - Docstrings should include:
    - A short description of the function/class.
    - Parameters and their types.
    - Return type and description.
    - Exceptions raised by the function/class.
- Use `gettext` for translations. Only English strings are allowed in the code (no hardcoded translated text).

## Project Management

- We use **YouTrack** for issue tracking and project management.
- Branch names and commit messages must reference the related YouTrack issue (e.g., `HAB-123`).
- All pull requests should reference the corresponding issue and include a brief description of the changes.

## Folder Structure

src/habarico
├── contrib/         # Extra functionality and customizations
├── filters/         # Resource filters
├── locale/          # Localization files
├── schema/          # Schema classes and generators
├── admin.py         # Main admin classes
├── apps.py          # Django app configuration
├── response.py      # Habarico DRF responses
├── settings.py      # Habarico configuration used in Django settings
├── site.py          # Register for Habarico admins
├── utils.py         # Utility functions
└── views.py         # Habarico DRF views
