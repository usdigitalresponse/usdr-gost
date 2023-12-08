# How to contribute to U.S. Digital Response projects

Everyone is welcome to contribute, and we value everybody's contribution.
Code is not the only way to help the community.
Answering questions, helping others, reaching out, and improving documentation are all immensely valuable to the community.


## You can contribute in so many ways!

There are several ways you can contribute to this repository:

- Enhancing and/or fixing outstanding issues with the existing code
- Contributing useful improvements, clarifications, and updates to existing documentation
- Submitting [issues](https://github.com/usdigitalresponse/usdr-gost/issues/new/choose) related to bugs or desired new features
- Reporting security vulnerabilities

_All are equally valuable to the community._

We also onboard new volunteers to USDR projects in general at https://www.usdigitalresponse.org/volunteer.
Please sign up if you’d like to help on other projects.


## Submitting a new issue or feature request

Do your best to follow these guidelines when submitting an issue or a feature request.
It will make it easier for us to come back to you quickly and with good feedback.

First, please check whether your issue or feature request has already been submitted by searching our [open issues](https://github.com/usdigitalresponse/usdr-gost/issues?q=is%3Aopen+is%3Aissue).


### Bugs

If you find an [open bug](https://github.com/usdigitalresponse/usdr-gost/issues?q=is%3Aopen+is%3Aissue+label%3Abug) that sounds like your issue, please consider adding a comment to the existing issue with details that will help us better understand the problem.

To submit something new, please fill out and submit [this form](https://github.com/usdigitalresponse/usdr-gost/issues/new?template=default_issue.yml&title=%5BBug%5D%3A+).


### Security vulnerabilities

Please fill out and submit [this form](https://github.com/usdigitalresponse/usdr-gost/security/advisories/new)
if you believe you have discovered a security-related problem.


### New features

A world-class feature request addresses the following points:

1. Motivation first:
    - Is it related to a problem/frustration with the current system? If so, ease explain why.
    - Is it related to something you would need for a project? We'd love to hear about it!
    - Is it something you worked on and think could benefit the community?
    Awesome!
    Tell us what problem it solved for you.
    - Do you think you have a neat idea and want to share it?
    We love those too!
    Tell us your use-case and what value it might bring to the project.
2. Write a _full paragraph_ describing why you think the feature is important.
3. Provide a **code snippet** or **design mockup or sketch** if possible, to demonstrate its
future use.

By the way, your suggestions do not need to be restricted to changes to how this project works in a production environment!
We would love to hear your ideas for improving all types of things, including:
- Ways to enhance the developer experience.
- Testing and other maintainability strategies.
- Automated CI/CD workflows.


## Start contributing! (pull requests)

Before writing code, we strongly advise you to search through the existing PRs or issues to make sure that nobody is already working on the same thing.
If you are unsure, it is always a good idea to open an issue to get some feedback.

Things you will need:
- Basic `git` proficiency.
- Knowledge of one or more of the languages used in this project, such as JavaScript and/or Terraform.
- A development environment.
See the [Development](https://github.com/usdigitalresponse/usdr-gost/blob/main/README.md#development) section of our README for more information.
- A positive attitude.

Follow these steps to start contributing:

1. Fork the repository by clicking on the 'Fork' button on the repository's page.
This creates a copy of the code under your GitHub user account.
    - **Note:** If you are an active volunteer with contributor access to this repository,
    you may alternatively clone and make branches against this repository directly.
2. Clone your fork to your development environment.
3. Create a new branch to hold your development changes.
We recommend that you use the following conventions when naming your branch:
    | **Branch Prefix** | **Type of Contribution**                                               | **Example**                         |
    |-------------------|------------------------------------------------------------------------|-------------------------------------|
    | `feat/`           | New features and enhancements.                                         | `feat/generate-jetpacks`            |
    | `bug/` or `fix/`  | Changes that resolve or mitigate a problem.                            | `fix/jetpack-fuel-gauge-inaccuracy` |
    | `docs/`           | Improvements, clarifications, and/or updates to existing documentation | `docs/clarify-landing-instructions` |

4. Develop, commit, and push the features on your branch.
5. Once you are satisfied, submit your pull request!
    - Make sure the title of your PR represents a short summary of the contribution.
    - Fill out the different sections that appear in the pull request template.
    - Please include unit tests for all JavaScript code!
    - If your work isn't quite ready but you want early feedback, submit your pull request as a draft.
6. Don't worry if maintainers ask you for changes - it's all part of the collaborative process!
