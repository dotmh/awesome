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
const EMOJI_GUIDE = "emoji-guide.html";
const EMOJI_DATA = "github-emoji.json";

const baseFolder: string = import.meta.dirname;
const templatesFolder = join(baseFolder, "templates");
const partialsFolder = join(baseFolder, "partials");
const dataFolder = resolve(baseFolder, "../data");
const outputFolder = resolve(baseFolder, "../");

const headline = (text: string) => console.log(chalk.black.bgGreenBright(text));
const success = (text: string) => console.log(chalk.greenBright(text));
const error = (text: string) => console.error(chalk.black.bgRedBright(text));
const warn = (text: string) => console.warn(chalk.black.bgYellowBright(text));

const isDirectory = async (path: string) => {
    try {
        const statResult = await stat(path);
        return statResult.isDirectory();
    } catch {
        return false;
    }
}

const fileExists = async (path: string) => {
    try {
        await stat(path);
        return true;
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

const loadData = async (emojis: Record<string, string>): Promise<Group[]> => {
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
                assert(isValidEmoji(_data.emoji, emojis), `Invalid Emoji ${_data.emoji} used in ${file}`);
                _group.emoji = _data.emoji;
                continue;
            }

            assertIsData(_data);
            assert(isValidEmoji(_data.emoji, emojis), `Invalid Emoji ${_data.emoji} used in ${file}`);
            _group.children.push(_data);
        }
    }

    return data;
}

const getEmojiData = async (): Promise<Record<string, string>> => {
    let emojis: Record<string, string>;
    if (await fileExists(join(baseFolder, EMOJI_DATA))) {
        success(`Using Emoji Data from ${join(baseFolder, EMOJI_DATA)}`);
        const raw = await readFile(join(baseFolder, EMOJI_DATA), 'utf-8');
        emojis = JSON.parse(raw);
    } else {
        warn('Downloading Emoji Data from GitHub API');
        const response = await fetch(GITHUB_EMOJI_API);
        emojis = await response.json();
        await writeFile(join(baseFolder, EMOJI_DATA), JSON.stringify(emojis), { encoding: 'utf-8', flag: 'w' });
    }

    return emojis;
}

const isValidEmoji = async (emoji: string, emojis: Record<string, string>): Promise<boolean> => {
    const emojiMemo = Object.keys(emojis);
    return emojiMemo.includes(emoji);
}

const calculateStates = (data: Group[]): MetaData => {
    const groups: number = data.length;
    const categories: number = data.reduce((acc, group) => acc + group.children.length, 0);
    const resources: number = data.reduce((acc, group) => acc + group.children.reduce((acc, data) => acc + data.resources.length, 0), 0);
    const today = `${(new Date()).toLocaleString(LOCALE, { timeZone: TIMEZONE })}`
    return { today, groups, categories, resources };
}

try {

    headline(`Generating ${OUTFILE}`);
    success(`Using Data from ${dataFolder}`);

    loadHelpers();
    await loadPartials();

    const emojis = await getEmojiData();

    if (!await fileExists(join(outputFolder, EMOJI_GUIDE))) {
        headline('Building Emoji Guide');
        const emojiGuideTemplate = hb.compile(await readFile(join(templatesFolder, "emoji-guide.hbs"), 'utf-8'));
        await writeFile(join(outputFolder, EMOJI_GUIDE), emojiGuideTemplate({ emojis }), { encoding: 'utf-8', flag: 'w' });
        success(`Successfully generated ${join(outputFolder, EMOJI_GUIDE)}`);
    }

    const listData: Group[] = (await loadData(emojis)).sort((a, b) => {
        return parseInt(a.id, 10) - parseInt(b.id, 10);
    });

    const meta: MetaData = calculateStates(listData);

    success(`Found ${meta.groups} groups`);
    success(`Found ${meta.categories} categories`);
    success(`Found ${meta.resources} resources`);

    const template = hb.compile(await readFile(join(templatesFolder, "readme.hbs"), 'utf-8'));

    const awesomeData: { data: Group[] } & MetaData = { data: listData, ...meta };
    const readme = template(awesomeData);
    await writeFile(join(outputFolder, OUTFILE), readme, { encoding: 'utf-8', flag: 'w' });

    headline(`Successfully generated ${OUTFILE}`);

} catch (err) {
    error(`Error: ${err.message}`);
    process.exit(1);
}