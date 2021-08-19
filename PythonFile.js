/*
 * PythonFile.js - plugin to extract resources from a Python source code file
 *
 * Copyright © 2021, Box, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var fs = require("fs");
var path = require("path");
var log4js = require("log4js");
var IString = require("ilib/lib/IString.js");

var logger = log4js.getLogger("loctool.lib.PythonFile");

/**
 * Create a new python file with the given path name and within
 * the given project.
 *
 * @param {Project} project the project object
 * @param {String} pathName path to the file relative to the root
 * of the project file
 * @param {FileType} type the file type instance of this file
 */
var PythonFile = function(options) {
    options = options || {};
    this.project = options.project;
    this.pathName = options.pathName;
    this.type = options.type;

    this.API = this.project.getAPI();

    this.set = this.API.newTranslationSet(this.project ? this.project.sourceLocale : "zxx-XX");

    this.flavor = this.project && this.project.flavors && this.project.flavors.getFlavorForPath(this.pathName);
    if (this.flavor === "main") {
        this.flavor = undefined;
    }
};

var reUnicodeChar = /\\u([a-fA-F0-9]{1,4})/g;
var reOctalChar = /\\([0-8]{1,3})/g;

/**
 * Unescape the string to make the same string that would be
 * in memory in the target programming language. This includes
 * unescaping both special and Unicode characters.
 *
 * @static
 * @param {String} string the string to unescape
 * @returns {String} the unescaped string
 */
PythonFile.unescapeString = function(string) {
    var unescaped = string;

    while ((match = reUnicodeChar.exec(unescaped))) {
        if (match && match.length > 1) {
            var value = parseInt(match[1], 16);
            unescaped = unescaped.replace(match[0], IString.fromCodePoint(value));
            reUnicodeChar.lastIndex = 0;
        }
    }

    while ((match = reOctalChar.exec(unescaped))) {
        if (match && match.length > 1) {
            var value = parseInt(match[1], 8);
            unescaped = unescaped.replace(match[0], IString.fromCodePoint(value));
            reOctalChar.lastIndex = 0;
        }
    }

    unescaped = unescaped.
        replace(/^\\\\/g, "\\").
        replace(/([^\\])\\\\/g, "$1\\").
        replace(/\\'/g, "'").
        replace(/\\"/g, '"');

    return unescaped;
};

/**
 * Clean the string to make a source string. This means
 * removing leading and trailing white space, compressing
 * whitespaces, and unescaping characters. This changes
 * the string from what it looks like in the source
 * code.
 *
 * @static
 * @param {String} string the string to clean
 * @returns {String} the cleaned string
 */
PythonFile.cleanString = function(string) {
    var unescaped = PythonFile.unescapeString(string);

    unescaped = unescaped.
        replace(/\\[btnfr]/g, " ").
        replace(/[ \n\t\r\f]+/g, " ").
        trim();

    return unescaped;
};

/**
 * Make a new key for the given string. This must correspond
 * exactly with the code in htglob jar file so that the
 * resources match up. See the class IResourceBundle in
 * this project under the python directory for the corresponding
 * code.
 *
 * @private
 * @param {String} source the source string to make a resource
 * key for
 * @returns {String} a unique key for this string
 */
PythonFile.prototype.makeKey = function(source) {
    return PythonFile.cleanString(source);
};

var reGetStringBogusConcatenation1 = new RegExp(/(^R|\WR)B\.getString\s*\(\s*"((\\"|[^"])*)"\s*\+/g);
var reGetStringBogusConcatenation2 = new RegExp(/(^R|\WR)B\.getString\s*\([^\)]*\+\s*"((\\"|[^"])*)"\s*\)/g);
var reGetStringBogusParam = new RegExp(/(^R|\WR)B\.getString\s*\([^"\)]*\)/g);

var reGetString = new RegExp(/(^R|\WR)B\.getString\s*\(\s*"((\\"|[^"])*)"\s*\)/g);
var reGetStringWithId = new RegExp(/(^R|\WR)B\.getString\("((\\"|[^"])*)"\s*,\s*"((\\"|[^"])*)"\)/g);

var reUnderscore = new RegExp(/(^_|^gettext|^gettext_lazy|^gettext_noop|\W_|\Wgettext|\Wgettext_lazy|\Wgettext_noop)\s*\(\s*(rf?|f|u)?('((\\'|[^'])*)'|"((\\"|[^"])*)")\s*\)/g);
var reContext = new RegExp(/(^pgettext|^pgettext_lazy|\Wpgettext|\Wpgettext_lazy)\s*\(\s*(rf?|f|u)?('((\\'|[^'])*)'|"((\\"|[^"])*)")\s*,\s*('((\\'|[^'])*)'|"((\\"|[^"])*)")\s*\)/g);
var rePlural = new RegExp(/(^ngettext|^ngettext_lazy|\Wngettext|\Wngettext_lazy)\s*\(\s*(rf?|f|u)?('((\\'|[^'])*)'|"((\\"|[^"])*)")\s*,\s*(rf?|f|u)?('((\\'|[^'])*)'|"((\\"|[^"])*)")\s*,/g);
var reContextPlural = new RegExp(/(^npgettext|^npgettext_lazy|\Wnpgettext|\Wnpgettext_lazy)\s*\(\s*('((\\'|[^'])*)'|"((\\"|[^"])*)")\s*,\s*(rf?|f|u)?('((\\'|[^'])*)'|"((\\"|[^"])*)")\s*,\s*(rf?|f|u)?('((\\'|[^'])*)'|"((\\"|[^"])*)")\s*,/g);

var reI18nComment = new RegExp("//\\s*(.*)$");

/**
 * Parse the data string looking for the localizable strings and add them to the
 * project's translation set.
 * @param {String} data the string to parse
 */
PythonFile.prototype.parse = function(data) {
    logger.debug("Extracting strings from " + this.pathName);
    this.resourceIndex = 0;

    var source, key, context, plural, last, line, commentResult, result, r;
    
    reUnderscore.lastIndex = 0; // for safety
    result = reUnderscore.exec(data);
    while (result && result.length > 3 && result[3]) {
        source = result[4] || result[6];
        key = this.makeKey(source);
        logger.trace("Found string key: " + key + ", string: '" + source);
        if (source && source.length) {

            last = data.indexOf('\n', reUnderscore.lastIndex);
            last = (last === -1) ? data.length : last;
            line = data.substring(reUnderscore.lastIndex, last);
            commentResult = reI18nComment.exec(line);
            comment = (commentResult && commentResult.length > 1) ? commentResult[1] : undefined;

            // no-op strings are extracted, but not translated
            if (result[1] === "gettext_noop") {
                comment = "DO NOT TRANSLATE" + (comment ? " " + comment : '');
            }

            r = this.API.newResource({
                resType: "string",
                project: this.project.getProjectId(),
                key: key,
                sourceLocale: this.project.sourceLocale,
                source: this.API.utils.trimEscaped(PythonFile.unescapeString(source)),
                autoKey: true,
                pathName: this.pathName,
                state: "new",
                comment: comment,
                datatype: this.type.datatype,
                flavor: this.flavor,
                index: this.resourceIndex++
            });
            this.set.add(r);
        } else {
            logger.warn("Warning: Bogus empty string in get string call: ");
            logger.warn("... " + data.substring(result.index, reUnderscore.lastIndex) + " ...");
        }
        result = reGetString.exec(data);
    }

    reContext.lastIndex = 0; // for safety
    result = reContext.exec(data);
    while (result && result.length > 3 && result[3]) {
        source = result[4] || result[6];
        key = this.makeKey(source);
        logger.trace("Found string key: " + key + ", string: '" + source);
        if (source && source.length) {
            last = data.indexOf('\n', reContext.lastIndex);
            last = (last === -1) ? data.length : last;
            line = data.substring(reContext.lastIndex, last);
            commentResult = reI18nComment.exec(line);
            comment = (commentResult && commentResult.length > 1) ? commentResult[1] : undefined;

            if (result[8]) {
                context = result[9] || result[11];
            }

            r = this.API.newResource({
                resType: "string",
                project: this.project.getProjectId(),
                key: key,
                sourceLocale: this.project.sourceLocale,
                source: this.API.utils.trimEscaped(PythonFile.unescapeString(source)),
                autoKey: true,
                pathName: this.pathName,
                state: "new",
                comment: comment,
                context: context,
                datatype: this.type.datatype,
                flavor: this.flavor,
                index: this.resourceIndex++
            });
            this.set.add(r);
        } else {
            logger.warn("Warning: Bogus empty string in get string call: ");
            logger.warn("... " + data.substring(result.index, reContext.lastIndex) + " ...");
        }
        result = reGetString.exec(data);
    }

    rePlural.lastIndex = 0; // for safety
    result = rePlural.exec(data);
    while (result && result.length > 3 && result[3]) {
        source = result[4] || result[6];
        key = this.makeKey(source);
        logger.trace("Found string key: " + key + ", string: '" + source);
        if (source && source.length) {
            plural = result[10] || result[12];

            last = data.indexOf('\n', rePlural.lastIndex);
            last = (last === -1) ? data.length : last;
            line = data.substring(rePlural.lastIndex, last);
            commentResult = reI18nComment.exec(line);
            comment = (commentResult && commentResult.length > 1) ? commentResult[1] : undefined;

            r = this.API.newResource({
                resType: "plural",
                project: this.project.getProjectId(),
                key: key,
                sourceLocale: this.project.sourceLocale,
                sourcePlurals: {
                    one: this.API.utils.trimEscaped(PythonFile.unescapeString(source)),
                    other: this.API.utils.trimEscaped(PythonFile.unescapeString(plural))
                },
                autoKey: true,
                pathName: this.pathName,
                state: "new",
                comment: comment,
                datatype: this.type.datatype,
                flavor: this.flavor,
                index: this.resourceIndex++
            });
            this.set.add(r);
        } else {
            logger.warn("Warning: Bogus empty string in get string call: ");
            logger.warn("... " + data.substring(result.index, rePlural.lastIndex) + " ...");
        }
        result = reGetString.exec(data);
    }

    reContextPlural.lastIndex = 0; // for safety
    result = reContextPlural.exec(data);
    while (result && result.length > 8 && result[8]) {
        source = result[8] || result[10];
        key = this.makeKey(source);
        logger.trace("Found string key: " + key + ", string: '" + source);
        if (source && source.length) {
            plural = result[14] || result[16];

            last = data.indexOf('\n', reContextPlural.lastIndex);
            last = (last === -1) ? data.length : last;
            line = data.substring(reContextPlural.lastIndex, last);
            commentResult = reI18nComment.exec(line);
            comment = (commentResult && commentResult.length > 1) ? commentResult[1] : undefined;

            if (result[4]) {
                context = result[5] || result[7];
            }

            r = this.API.newResource({
                resType: "plural",
                project: this.project.getProjectId(),
                key: key,
                sourceLocale: this.project.sourceLocale,
                sourcePlurals: {
                    one: this.API.utils.trimEscaped(PythonFile.unescapeString(source)),
                    other: this.API.utils.trimEscaped(PythonFile.unescapeString(plural))
                },
                autoKey: true,
                pathName: this.pathName,
                state: "new",
                comment: comment,
                datatype: this.type.datatype,
                flavor: this.flavor,
                index: this.resourceIndex++
            });
            this.set.add(r);
        } else {
            logger.warn("Warning: Bogus empty string in get string call: ");
            logger.warn("... " + data.substring(result.index, reContextPlural.lastIndex) + " ...");
        }
        result = reGetString.exec(data);
    }

    // now check for and report on errors in the source
    this.API.utils.generateWarnings(data, reGetStringBogusConcatenation1,
        "Warning: string concatenation is not allowed in the RB.getString() parameters:",
        logger,
        this.pathName);

    this.API.utils.generateWarnings(data, reGetStringBogusConcatenation2,
        "Warning: string concatenation is not allowed in the RB.getString() parameters:",
        logger,
        this.pathName);

    this.API.utils.generateWarnings(data, reGetStringBogusParam,
        "Warning: non-string arguments are not allowed in the RB.getString() parameters:",
        logger,
        this.pathName);
};

/**
 * Extract all the localizable strings from the python file and add them to the
 * project's translation set.
 */
PythonFile.prototype.extract = function() {
    logger.debug("Extracting strings from " + this.pathName);
    if (this.pathName) {
        var p = path.join(this.project.root, this.pathName);
        try {
            var data = fs.readFileSync(p, "utf8");
            if (data) {
                this.parse(data);
            }
        } catch (e) {
            logger.warn("Could not read file: " + p);
            logger.warn(e);
        }
    }
};

/**
 * Return the set of resources found in the current Python file.
 *
 * @returns {TranslationSet} The set of resources found in the
 * current Python file.
 */
PythonFile.prototype.getTranslationSet = function() {
    return this.set;
}

//we don't localize or write python source files
PythonFile.prototype.localize = function() {};
PythonFile.prototype.write = function() {};

module.exports = PythonFile;
