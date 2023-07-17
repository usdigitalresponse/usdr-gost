# Decisions

This directory contains decision records for the USDR GOST project.

## What are ADRs?

An Architecture Decision Record is a text file, with a particular format, and an associated discussion. It is numbered for easy reference, and it has a general format. ADRs were documented by Michael Nygard in [this blog post](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions) and are now used by many projects.

## When Should I Create an ADR?

As outlined by Michael Nygard, ADRs represent "architecturally significant" decisions.

The subject of an ADR should affect one of the following areas:

- Structure
- Dependencies
- Interfaces
- Construction techniques

Small changes don't need one, but for larger changes that would introduce a new dependency or affect our overall system architecture, we recommend opening one.

## How to: Create a New ADR record for discussion

To create a new ADR, copy the [./templates/template.md](templates/template.md) file to a new file in this directory. The file name should be `NNNN-title-of-decision.md`, where `NNNN` is the next sequential number for the ADR. For example, if the last ADR was `0001-record-architecture-decisions.md`, the next one would be `0002-title-of-decision.md`.

You can also use the [adr-tools](https://github.com/npryce/adr-tools/blob/master/INSTALL.md) CLI to create new ADRs from this template.

Once you've created a new ADR, you can open a PR to discuss it with the team.

## How to: Create an ADR PR

Create a new ADR, then create a PR within the USDR-gost [repo](https://github.com/usdigitalresponse/usdr-gost/) with your change. Solicit comments on the ADR via this PR, then once all comments are resolved, ask someone to approve the PR and merge it. You may need to re-number the ADR if another one has come in while your proposal was being discussed.

See [this ADR](./0001-decision-record-process.md) for details on the process.

## How to: Diagrams in ADRs

We recommend using [Mermaid](https://github.com/mermaid-js/mermaid) to create diagrams in text. Text-based diagrams are easier to diff, version, and scale than traditional diagrams.

Github now natively supports Mermaid diagrams in Markdown files (more [here](https://github.blog/2022-02-14-include-diagrams-markdown-files-mermaid/)), so you can also view the diagrams in the Github UI by simply including a code block with the language set to `mermaid`, for example:

```text
    ```mermaid
       testDiagram
    ```
```

You can author Mermaid diagrams using the [Mermaid Live Editor](https://mermaid.live/) and then copy the generated Markdown into your ADR. More easily, to preview the diagrams in VSCode, you can install the [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) extension to view the diagrams as you write markdown directly.

## Tooling Tips

- **ADR-Tools** : To make working with ADRs a bit easier, you can use the [adr-tools](https://github.com/npryce/adr-tools/blob/master/INSTALL.md) CLI to create new ADRs from the template
- **MarkdownLint** : To ensure that the ADRs are formatted correctly, you can use [MarkdownLint](https://github.com/DavidAnson/markdownlint), and if you're using VSCode, you can install the [MarkdownLint Extension](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)
- **Markdown Preview Mermaid Support** [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) extension to view the diagrams as you write markdown directly.

## References

- More general information about architectural decision records is available at <https://adr.github.io/>.

- Our template is based on MADR, the Markdown Any Decision Records standard, more info here: <https://adr.github.io/madr/>.
