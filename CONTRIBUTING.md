# How to contribute to U.S. Digital Response projects

Everyone is welcome to contribute, and we value everybody's contribution. Code
is not the only way to help the community. Answering questions, helping
others, reaching out, and improving the documentation are all immensely valuable
to the community.


## You can contribute in so many ways!

There are 3 ways you can contribute to this project:

- Fixing outstanding issues with the existing code;
- Contributing to the examples or to the documentation;
- Submitting issues related to bugs or desired new features.

_All are equally valuable to the community._

We also onboard new volunteers to USDR projects in general at [https://www.usdigitalresponse.org/raisingyourhand](https://www.usdigitalresponse.org/raisingyourhand). Please sign up if you’d like to help on other projects.


## Submitting a new issue or feature request

Do your best to follow these guidelines when submitting an issue or a feature
request. It will make it easier for us to come back to you quickly and with good
feedback.


### Did you find a bug?

Open source code is robust and reliable thanks to the users who notify us of
the problems they encounter, so thank you for reporting an issue.

First, we would really appreciate it if you could **make sure the bug was not
already reported** (use the search bar on GitHub under the “Issues” tab).

Did not find it? :( So we can act quickly on it, please include the following:

- Your **operating system**.
- If the problem is with the API, your **client (e.g. cURL, Python Requests)**.
- If the problem was with the demo UI or docs pages, your **browser (e.g. Firefox, Chrome, Edge, Internet Explorer)**.
- Any code errors that you have access to.


### Do you want a new feature?

A world-class feature request addresses the following points:

1. Motivation first:

- Is it related to a problem/frustration with the current system? If so, please explain why.
- Is it related to something you would need for a project? We'd love to hear about it!
- Is it something you worked on and think could benefit the community? Awesome! Tell us what problem it solved for you.

2. Write a _full paragraph_ describing the feature;
3. Provide a **code snippet** or **design mockup or sketch** if possible, to demonstrate its future use.

If your issue is well written, we’re already 80% of the way there by the time you
post it.


## Start contributing! (Pull Requests)

Before writing code, we strongly advise you to search through the exising PRs or
issues to make sure that nobody is already working on the same thing. If you are
unsure, it is always a good idea to open an issue to get some feedback.

You will need basic `git` proficiency to be able to contribute to
this project. `git` is not the easiest tool to use but it has the greatest
manual. Type `git --help` in a shell and enjoy.

Follow these steps to start contributing:

1. Fork the repository by
   clicking on the 'Fork' button on the repository's page. This creates a copy of the code
   under your GitHub user account.

2. Clone your fork to your local disk

3. Create a new branch to hold your development changes:

   ```bash
   $ git checkout -b a-descriptive-name-for-my-changes
   ```

   please avoid working on the `main` or `gh-pages` branch directly.

4. Develop the features on your branch.

   Once you're happy with your changes, add changed files using `git add` and
   make a commit with `git commit` to record your changes locally:

   ```bash
   $ git add modified_file.py
   $ git commit
   ```

   Please write [good commit messages](https://chris.beams.io/posts/git-commit/).

   It is a good idea to sync your copy of the code with the original
   repository regularly. This way you can quickly account for changes:

   ```bash
   $ git fetch origin
   $ git rebase origin/master
   ```

   Push the changes to your account using:

   ```bash
   $ git push -u origin a-descriptive-name-for-my-changes
   ```

5. Once you are satisfied (**and the checklist below is happy, too**), go to the
   webpage of your fork on GitHub. Click on 'Pull request' to send your changes
   to the project maintainers for review.

6. It's ok if maintainers ask you for changes. It happens to core contributors
   too! So everyone can see the changes in the Pull request, work in your local
   branch and push the changes to your fork. They will automatically appear in
   the pull request.


### Checklist

1. The title of your pull request should be a summary of its contribution;

2. If your pull request adresses an issue, please [mention the issue number in
   the pull request description to make sure they are linked](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword) (and so people consulting the issue know you are working on it);

3. To indicate a work in progress, please submit your pull request as a draft.
   This is useful to avoid duplicated work, and to differentiate it from PRs
   ready to be merged.

   ![Creating a draft pull request](./docs/_assets/draft-pr.png)

4. If there are any tests, make sure that they pass and cover your new features and bugfixes.


#### This guide was based on [HuggingFace/transformers](https://github.com/huggingface/transformers/blob/master/CONTRIBUTING.md) which was itself based on [SciKit-Learn](https://github.com/scikit-learn/scikit-learn/blob/master/CONTRIBUTING.md)
