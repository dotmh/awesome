![DotMH](https://github.com/dotmh/dotmh/raw/master/logo.png)

# Awesome List Compiler

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![PNPM](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)
![Vitest](https://img.shields.io/badge/-Vitest-252529?style=for-the-badge&logo=vitest&logoColor=FCC72B)
![Handlebars](https://img.shields.io/badge/Handlebars-%23000000?style=for-the-badge&logo=Handlebars.js&logoColor=white)
![YAML](https://img.shields.io/badge/yaml-%23ffffff.svg?style=for-the-badge&logo=yaml&logoColor=151515)
![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white)

This folder contains the tooling to auto generate a list of resources for an [awesome](https://github.com/sindresorhus/awesome) style list.

It is designed to take the data from a series of YML files in a data directory and use handlebars to compile that in to the finished Readme.

## Getting Start

- clone this repo `git clone git@github.com:dotmh/awesome-dotmh.git`
- change into the local repo `cd ./awesome-dotmh`
- change to using the specified version of node with nvm `nvm use`
- install dependencies for the build script with `pnpm install`
- generate the readme.md with `pnpm build`

## Adding, Editing or Removing links

All the links are stored in yaml in the [/data](/data) folder. Each Yaml file represents a Category on the
main Readme.md.

### Adding, Editing or Removing a Link

Find the category that the link is in and then edit is corresponding yaml file. Under that file you will
find an yaml array containing information on each link.

Example

```yaml
name: My Stack
description: |
  This is the default stack that I use for most projects. I find it very productive and easy to work with.
  This isn't the only stack that I use, but it's the one that I use most often.
resources:
  - name: Typescript
    description: My favourite programming language
    link: https://www.typescriptlang.org/
```

You can edit the link by updating the information, to delete the link simple remove everything just before the `-` of the resource information to just before the next `-`

You can add a new link by adding a new element to represent that resources i.e.

```yaml
- name: Name of the link (keep this one short)
  description: Description of the linked resource
  link: A link to the resource
```

### Adding a new Category

Create a new file in the [/data](/data) directory to represent the category you want to add links for. The file should be named the same as the name but using `-` instead of spaces. A number at the beginning controls the order categories appear on the README.

Example

```
30_csharp_and_dotnet.yaml
```

Then copy the following into the file

```
name:
description: |

resources:
  - name:
    description:
    link:
```

Name should match the file name but in a natural form i.e. here it would be `CSharp And DotNet`, the description can be multiline and should start on the blank line after the `|`.

Resources is a list of resource links see above for more information.

### Rebuilding the Readme

- run `pnpm build` to re-build the readme.

## Templates

The build script uses [handlebars](https://handlebarsjs.com/) to control the general look and feel.
The templates are stored in [/scripts/templates](/scripts/templates) , the templates make reference to
partials stored in [/scripts/partials](/scripts/partials).

Partials are autoloaded by the build script and use their filename as the partial name.
i.e. to include the logo partial [/scripts/partials/logo.hbs](/scripts/partials/logo.hbs) you would use

```handlebars
{{> logo}}
```

Lastly some Handlebars helpers are provided in [/scripts/hbs-helpers.ts](/scripts/hbs-helpers.ts) they are
referenced by their exported name.

- asAnchor - `{{asAnchor name}} converts the name of a category into an anchor link for github

## License

This repo is set up with an [Apache 2.0](https://opensource.org/license/apache-2-0) license and this will carry over to any projects that are
generated from the template unless you remove it.
