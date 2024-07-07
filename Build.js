const fs = require('fs').promises
const path = require('path')

const JSProcessorOptions = {
    compact: true,
    controlFlowFlattening: false,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: false,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    domainLock: [],
    domainLockRedirectUrl: 'about:blank',
    forceTransformStrings: [],
    identifierNamesCache: null,
    identifierNamesGenerator: 'hexadecimal',
    identifiersDictionary: [],
    identifiersPrefix: '',
    ignoreImports: false,
    inputFileName: '',
    log: false,
    numbersToExpressions: false,
    optionsPreset: 'default',
    renameGlobals: false,
    renameProperties: false,
    renamePropertiesMode: 'safe',
    reservedNames: [],
    reservedStrings: [],
    seed: 0,
    selfDefending: false,
    simplify: true,
    sourceMap: false,
    sourceMapBaseUrl: '',
    sourceMapFileName: '',
    sourceMapMode: 'separate',
    sourceMapSourcesMode: 'sources-content',
    splitStrings: false,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.5,
    stringArrayEncoding: [],
    stringArrayIndexesType: ['hexadecimal-number'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.75,
    target: 'browser',
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
}

const CSSProcessorOptions = {
    level: 2,
}

const CSSProcessor = require('clean-css')
const JSProcessor = require('javascript-obfuscator')

const { Log, LogColors } = require('./Log')

const PackStylesheets = async () => {
    Log(`Merging stylesheets...`)
    let Stylesheet = ''
    let filenames = await fs.readdir(path.join(__dirname, "css"))
    for (let x = 0; x < filenames.length; x++) {
        filenames[x] = path.join(__dirname, 'css', filenames[x])
    }
    for (let x = 0; x < filenames.length; x++) {
        if (filenames[x].endsWith('.css')) {
            Stylesheet += await fs.readFile(filenames[x], { encoding: 'utf8', flag: 'r' }) + '\n\n'
        }
    }

    for (let x = 0; x < Stylesheet.length; x++) {
        Stylesheet = Stylesheet.replace('\n', '')
        Stylesheet = Stylesheet.replace('    ', '')
    }

    Log(`Processing/minifying stylesheets...`)
    Stylesheet = new CSSProcessor(CSSProcessorOptions).minify(Stylesheet).styles;

    await fs.mkdir('./build', { recursive: true })
    let OutputFile = path.join(__dirname, '/build/production.css')
    await fs.writeFile(OutputFile, Stylesheet, { encoding: "utf-8" })

    Log(`Finished stylesheets!`)
}

const ApplyObfuscation = false;
const PackScripts = async () => {
    Log(`Merging scripts...`)
    let Script = ''
    let filenames = await fs.readdir(path.join(__dirname, "scripts"))
    for (let x = 0; x < filenames.length; x++) {
        filenames[x] = path.join(__dirname, 'scripts', filenames[x])
    }
    for (let x = 0; x < filenames.length; x++) {
        if (filenames[x].endsWith('.js')) {
            Script += await fs.readFile(filenames[x], { encoding: 'utf8', flag: 'r' }) + '\n\n'
        }
    }

    if (ApplyObfuscation) {
        Log(`Applying Javascript obfuscation!`)
        Script = JSProcessor.obfuscate(Script, JSProcessorOptions).getObfuscatedCode()
    }
    else {
        Log(`Skipped Javascript obfuscation!`, LogColors.Warning)
    }

    await fs.mkdir('./build', { recursive: true })
    let OutputFile = path.join(__dirname, '/build/production.js')
    await fs.writeFile(OutputFile, Script, { encoding: "utf-8" })

    Log(`Finished scripts!`)
}

const { Home } = require('./pages/Home')
const RunBuild = async () => {
    Log(`Starting build!`)
    const StartTime = Date.now();
    await PackStylesheets()
    await PackScripts()
    const OutputHTML = await Home();
    await fs.writeFile(path.join(__dirname, '/build/index.html'), OutputHTML, { encoding: "utf-8" })
    Log(`Moving dependencies to /build directory...`,)
    await fs.cp(path.join(__dirname, "fonts"), path.join(__dirname, "build", "fonts"), { recursive: true, force: true })
    await fs.cp(path.join(__dirname, "assets"), path.join(__dirname, "build", "assets"), { recursive: true, force: true })
    Log(`Cleaning up...`,)
    await fs.rm(path.join(__dirname, "build", "production.css"))
    await fs.rm(path.join(__dirname, "build", "production.js"))
    const EndTime = Date.now();
    Log(`Build finished in ${EndTime - StartTime}ms!`, LogColors.Success)
}
RunBuild();