import { basename, join, resolve } from "node:path";
import { glob, readFile, stat, writeFile } from "node:fs/promises";
import { parse } from 'yaml';
import hb from "handlebars";
import chalk from "chalk";

import { assertIsData, MetaData, type Data } from "./data";
import hbsHelpers from "./hbs-helpers";

const YAML = "yaml";
const YML = "yml";
const validYamlExtensions = [YAML, YML] as const;
const HBS = "hbs";

const baseFolder: string = import.meta.dirname;
const templatesFolder = join(baseFolder, "templates");
const partialsFolder = join(baseFolder, "partials");
const dataFolder = resolve(baseFolder, "../data");
const outputFolder = resolve(baseFolder, "../");

const outFile = "README.md";

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

const loadData = async (): Promise<Data[]> => {
    const data: Data[] = [];
    for await (const file of glob(`${dataFolder}/**/*.{${validYamlExtensions.join(",")}}`)) {
        if (!await isDirectory(file)) {
            const raw = await readFile(file, 'utf-8');
            const _data = parse(raw);
            assertIsData(_data);
            data.push(_data);
        }
    }

    return data;
}

try {

    console.log(chalk.black.bgGreenBright(`Generating ${outFile}`));
    console.log(chalk.greenBright(`Using Data from ${dataFolder}`));

    loadHelpers();
    await loadPartials();

    const listData: Data[] = await loadData();
    const meta: MetaData = {
        totalDataFiles: listData.length,
        totalResources: listData.reduce((acc, data) => acc + data.resources.length, 0),
        today: new Date().toISOString()
    }

    console.log(chalk.greenBright(`Found ${meta.totalDataFiles} data files`));
    console.log(chalk.greenBright(`Found ${meta.totalResources} resources`));

    const template = hb.compile(await readFile(join(templatesFolder, "readme.hbs"), 'utf-8'));

    const awesomeData: { data: Data[] } & MetaData = { data: listData, ...meta };
    const readme = template(awesomeData);
    await writeFile(join(outputFolder, outFile), readme, { encoding: 'utf-8', flag: 'w' });

    console.log(chalk.black.bgGreenBright(`Successfully generated ${outFile}`));

} catch (error) {
    console.error(chalk.black.bgRedBright(`Error: ${error.message}`));
    process.exit(1);
}