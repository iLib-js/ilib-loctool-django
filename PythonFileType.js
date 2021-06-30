/*
 * PythonFileType.js - Represents a collection of python files
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
var ilib = require("ilib");
var Locale = require("ilib/lib/Locale.js");
var ResBundle = require("ilib/lib/ResBundle.js");
var log4js = require("log4js");

var PythonFile = require("./PythonFile.js");

var logger = log4js.getLogger("loctool.lib.PythonFileType");

var PythonFileType = function(project) {
    this.type = "python";
    this.datatype = "python";

    this.project = project;
    this.API = this.project.getAPI();

    this.extensions = [ ".python", ".jav" ];

    this.extracted = this.API.newTranslationSet(this.project.getSourceLocale());
    this.newres = this.API.newTranslationSet(this.project.getSourceLocale());
    this.pseudo = this.API.newTranslationSet(this.project.getSourceLocale());
};

var extensionRE = new RegExp(/\.python$/);

/**
 * Return true if the given path is a python file and is handled
 * by the current file type.
 *
 * @param {String} pathName path to the file being questions
 * @returns {boolean} true if the path is a python file, or false
 * otherwise
 */
PythonFileType.prototype.handles = function(pathName) {
    logger.debug("PythonFileType handles " + pathName + "?");
    var ret = extensionRE.test(pathName);
    logger.debug(ret ? "Yes" : "No");
    return ret;
};

PythonFileType.prototype.name = function() {
    return "Python File Type";
};

/**
 * Write out the aggregated resources for this file type. In
 * some cases, the string are written out to a common resource
 * file, and in other cases, to a type-specific resource file.
 * In yet other cases, nothing is written out, as the each of
 * the files themselves are localized individually, so there
 * are no aggregated strings.
 * @param {TranslationSet} translations the set of translations from the
 * repository
 * @param {Array.<String>} locales the list of locales to localize to
 */
PythonFileType.prototype.write = function(translations, locales) {
    // distribute all the resources to their resource files
    // and then let them write themselves out
    var resFileType = this.project.getResourceFileType();
    var res, file,
        resources = this.extracted.getAll(),
        db = this.project.db,
        translationLocales = locales.filter(function(locale) {
            return locale !== this.project.sourceLocale && locale !== this.project.pseudoLocale;
        }.bind(this));

    for (var i = 0; i < resources.length; i++) {
        res = resources[i];
        // have to store the base English string or else there will be nothing to override in the translations
        file = resFileType.getResourceFile(res.context, res.getSourceLocale(), res.resType + "s", res.pathName);
        file.addResource(res);

        // for each extracted string, write out the translations of it
        translationLocales.forEach(function(locale) {
            logger.trace("Localizing Python strings to " + locale);

            db.getResourceByHashKey(res.hashKeyForTranslation(locale), function(err, translated) {
                var r = translated;
                if (res.dnt) {
                    logger.trace("Resource " + res.reskey + " is set to 'do not translate'");
                } else if (!r || this.API.utils.cleanString(res.getSource()) !== this.API.utils.cleanString(r.getSource())) {
                    if (r) {
                        logger.trace("extracted   source: " + this.API.utils.cleanString(res.getSource()));
                        logger.trace("translation source: " + this.API.utils.cleanString(r.getSource()));
                    }
                    var note = r && 'The source string has changed. Please update the translation to match if necessary. Previous source: "' + r.getSource() + '"';
                    var newres = res.clone();
                    newres.setTargetLocale(locale);
                    newres.setTarget((r && r.getTarget()) || res.getSource());
                    newres.setState("new");
                    newres.setComment(note);

                    this.newres.add(newres);

                    // skip because the fallbacks will go to the English resources anyways
                    logger.trace("No translation for " + res.reskey + " to " + locale);
                } else if (r.getTarget() !== res.getSource()) {
                    file = resFileType.getResourceFile(r.context, locale, r.resType + "s", r.pathName);
                    file.addResource(r);
                    logger.trace("Added " + r.reskey + " to " + file.pathName);
                }
            }.bind(this));
        }.bind(this));
    }

    resources = this.pseudo.getAll().filter(function(resource) {
        return resource.datatype === this.datatype;
    }.bind(this));

    for (var i = 0; i < resources.length; i++) {
        res = resources[i];
        // only need to add the resource if it is different from the source text
        if (res.getSource() !== res.getTarget()) {
            file = resFileType.getResourceFile(res.context, res.getTargetLocale(), res.resType + "s", res.pathName);
            file.addResource(res);
            logger.trace("Added " + res.reskey + " to " + file.pathName);
        }
    }
};

/**
 * Find or create the resource file object for the given project, context,
 * and locale.
 *
 * @param {Resource} res resource to find the resource file for
 * @return {IosStringsFile} the Android resource file that serves the
 * given project, context, and locale.
 */
PythonFileType.prototype.getResourceFile = function(res) {
    var locale = res.getTargetLocale() || res.getSourceLocale(),
        pathName = res.getPath(),
        type = res.getDataType(),
        flavor = res.getFlavor && res.getFlavor();
    var newPath = this.getResourceFilePath(locale, pathName, type, flavor);

    logger.trace("getResourceFile converted path " + pathName + " for locale " + locale + " to path " + newPath);

    var resfile = this.resourceFiles && this.resourceFiles[newPath];

    if (!resfile) {
        resfile = this.resourceFiles[newPath] = new IosStringsFile({
            project: this.project,
            locale: locale || this.project.sourceLocale,
            pathName: newPath,
            type: this
        });

        logger.trace("Defining new resource file");
    } else {
        logger.trace("Returning existing resource file");
    }

    return resfile;
};

PythonFileType.prototype.newFile = function(path) {
    return new PythonFile({
        project: this.project,
        pathName: path,
        type: this
    });
};

PythonFileType.prototype.getDataType = function() {
    return this.datatype;
};

PythonFileType.prototype.getResourceTypes = function() {
    return {
        "string": "ContextResourceString"
    };
};

PythonFileType.prototype.getExtensions = function() {
    return this.extensions;
};

/**
 * Return the translation set containing all of the extracted
 * resources for all instances of this type of file. This includes
 * all new strings and all existing strings. If it was extracted
 * from a source file, it should be returned here.
 *
 * @returns {TranslationSet} the set containing all of the
 * extracted resources
 */
PythonFileType.prototype.getExtracted = function() {
    return this.extracted;
};

/**
 * Add the contents of the given translation set to the extracted resources
 * for this file type.
 *
 * @param {TranslationSet} set set of resources to add to the current set
 */
PythonFileType.prototype.addSet = function(set) {
    this.extracted.addSet(set);
};

/**
 * Return the translation set containing all of the new
 * resources for all instances of this type of file.
 *
 * @returns {TranslationSet} the set containing all of the
 * new resources
 */
PythonFileType.prototype.getNew = function() {
    return this.newres;
};

/**
 * Return the translation set containing all of the pseudo
 * localized resources for all instances of this type of file.
 *
 * @returns {TranslationSet} the set containing all of the
 * pseudo localized resources
 */
PythonFileType.prototype.getPseudo = function() {
    return this.pseudo;
};

module.exports = PythonFileType;
