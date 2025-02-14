import { basename, dirname, join, resolve, sep } from "node:path";
import { glob, readFile, stat, writeFile } from "node:fs/promises";
import assert from "node:assert";

import { parse } from 'yaml';
import hb from "handlebars";
import chalk from "chalk";

import { assertIsData, type Group, type MetaData } from "./data";
import hbsHelpers from "./hbs-helpers";

const YAML = "yaml";
const YML = "yml";
const validYamlExtensions = [YAML, YML] as const;
const HBS = "hbs";
const GITHUB_EMOJI_API = "https://api.github.com/emojis";
const LOCALE = "en-GB";
const TIMEZONE = "UTC";
const OUTFILE = "README.md";

const baseFolder: string = import.meta.dirname;
const templatesFolder = join(baseFolder, "templates");
const partialsFolder = join(baseFolder, "partials");
const dataFolder = resolve(baseFolder, "../data");
const outputFolder = resolve(baseFolder, "../");

const isDirectory = async (path: string) => {
    try {
        const statResult = await stat(path);
        return statResult.isDirectory();
    } catch {
        return false;
    }
}

const loadPartials = async () => {
    const partialFiles: string[][] = []
    for await (const file of glob(`${partialsFolder}/**/*.${HBS}`)) {
        if (!await isDirectory(file)) {
            partialFiles.push([
                basename(file, `.${HBS}`),
                await readFile(file, 'utf-8')
            ]);
        }
    }
    hb.registerPartial(Object.fromEntries(partialFiles));
}

const loadHelpers = () => {
    hb.registerHelper(hbsHelpers);
}

const loadData = async (): Promise<Group[]> => {
    const data: Group[] = [];
    for await (const file of glob(`${dataFolder}/**/*.{${validYamlExtensions.join(",")}}`)) {
        if (!await isDirectory(file)) {
            const pathWithoutBase = file.replace(dataFolder, "");
            const groupId = dirname(pathWithoutBase).replace(sep, "");

            if (data.findIndex(d => d.id === groupId) === -1) {
                data.push({ id: groupId, name: "", description: "", emoji: "", children: [] });
            }

            const _group = data.find(d => d.id === groupId);
            assert(_group !== undefined, "Group not found");

            const raw = await readFile(file, 'utf-8');
            const _data = parse(raw);

            if (basename(file).startsWith("00-")) {
                _group.name = _data.name;
                _group.description = _data.description;
                assert(isValidEmoji(_data.emoji), `Invalid Emoji ${_data.emoji} used in ${file}`);
                _group.emoji = _data.emoji;
                continue;
            }

            assertIsData(_data);
            assert(isValidEmoji(_data.emoji), `Invalid Emoji ${_data.emoji} used in ${file}`);
            _group.children.push(_data);
        }
    }

    return data;
}

const isValidEmoji = async (emoji: string): Promise<boolean> => {
    const response = await fetch(GITHUB_EMOJI_API);
    const emojis = await response.json();
    const emojiNames = Object.keys(emojis);
    return emojiNames.includes(emoji);
}

const calculateStates = (data: Group[]): MetaData => {
    const groups: number = data.length;
    const categories: number = data.reduce((acc, group) => acc + group.children.length, 0);
    const resources: number = data.reduce((acc, group) => acc + group.children.reduce((acc, data) => acc + data.resources.length, 0), 0);
    const today = `${(new Date()).toLocaleString(LOCALE, { timeZone: TIMEZONE })}`
    return { today, groups, categories, resources };
}


try {

    console.log(chalk.black.bgGreenBright(`Generating ${OUTFILE}`));
    console.log(chalk.greenBright(`Using Data from ${dataFolder}`));

    loadHelpers();
    await loadPartials();

    const listData: Group[] = (await loadData()).sort((a, b) => {
        return parseInt(a.id, 10) - parseInt(b.id, 10);
    });

    const meta: MetaData = calculateStates(listData);

    console.log(chalk.greenBright(`Found ${meta.groups} groups`));
    console.log(chalk.greenBright(`Found ${meta.categories} categories`));
    console.log(chalk.greenBright(`Found ${meta.resources} resources`));

    const template = hb.compile(await readFile(join(templatesFolder, "readme.hbs"), 'utf-8'));

    const awesomeData: { data: Group[] } & MetaData = { data: listData, ...meta };
    const readme = template(awesomeData);
    await writeFile(join(outputFolder, OUTFILE), readme, { encoding: 'utf-8', flag: 'w' });

    console.log(chalk.black.bgGreenBright(`Successfully generated ${OUTFILE}`));

} catch (error) {
    console.error(chalk.black.bgRedBright(`Error: ${error.message}`));
    process.exit(1);
}