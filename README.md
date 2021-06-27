# ilib-loctool-django

A loctool plugin that knows how to extract strings from python files
using the Django framework and GNU gettext utilities. If you have followed
the [Django translation documentation](https://docs.djangoproject.com/en/3.2/topics/i18n/translation/)
then this plugin can extract strings for your project. You do not need
to run `django-admin makemessages` to extract the strings first, as
this plugin will extract and localize the strings for you.

## Configuration

```json
{
  [...]
  "settings": {
    "django": {
      "writeSource": true,
      "mappings": {
        "django/source/**/*.py": {
          "template": "myproduct/locale/[locale]/LC_MESSAGES/django.po",
          "localeMap": {
            "de-DE": "de",
            "es-ES": "es",
            "zh-Hans-CN": "zh_CN",
            "en-US": "en",
            "en-GB": "en_GB"
          }
        }
      }
    }
  }
}
```

- writeSource - if set to true, specifies that the loctool should write out the
po file for the source locale as well (usually en-US).

The mappings map a minimatch-style expression to settings to use for files that
match that expression. The possible settings are:

- template - specifies the output files name template (a po file). Output must
  be a po file in order for Django to pick it up properly. The po file can be
  compiled into a binary mo file using the msgfmt tool.
- localeMap - a mapping between the BCP-47 locale specifiers to any other type
  of locale specifier that Django/python may be expecting

## Extracting Strings
 
This plugin will look for the string parameters of the calls to any of the
following GNU gettext functions:

- gettext('string to translate') or _('string to translate')
- gettext_lazy('string to translate')
- gettext_noop('string to translate')
- pgettext('string to translate', 'context string')
- pgettext_lazy('string to translate', 'context string')
- ngettext('singular string', 'plural string', count)
- ngettext_lazy('singular string', 'plural string', count)
- npgettext('context string', 'singular string', 'plural string', count)
- npgettext_lazy('context string', 'singular string', 'plural string', count)

The functions will produce either string resources or plural resources.

## String Types

This plugin supports the following types of strings as parameters to the above
functions:

- regular strings: "regular string"
- raw strings: r'raw \" string'
- f-strings: f'format {string}'
- raw f-strings: rf'format {string}'
- Unicode strings: u'unicode string'
- single quoted strings: 'single'
- double quoted strings: "double"
- multi-line strings: """ multi-line string including line breaks """

Additionally, if the string is not a raw string, this plugin will handle
escape code such as `\n` and `\NNN` (octal) and `\xHH` (hex).

## Errors in Call Parameters

This plugin will warn about errors in call parameters but continue with the
extraction. Warnings should be addressed in your code as soon as possible,
or else the translation may not work.

### Concatenation

Concatenation of the string parameters is not allowed:

```python
gettext('string ' + 'another string')
```

Use one long string instead.

### Formatting in the Parameters

Do not format inside of your function call:

```python
gettext('string %(name)s' % {"name": "Joe"})
```

This will not do what you expect. It will format the string,
and then call the `gettext` function to look up the translation
of the formatted string, which will not be there. Instead, you
should format outside of the parameters:

```python
gettext('string %(name)s') % {"name": "Joe"}
```

### Expression Parameters

If you pass an expression as a parameter, this will not work
as you expect. This plugin is not a full python parser and
cannot predict which strings may be contained in a variable
and therefore cannot extract them.

```python

s = "Hello"

gettext(s)    // error
```
 
# Translator Comments

Any comment located on the line before an extracted string that starts with the
string "L10N" will be extracted as a translator comment for the string
or strings that follow it. Alternately, any comment on the same line as an
extracted string which begins with "L10N" will also be extracted

Examples:

```python
# L10N this is the month, not a verb
gettext('May')


gettext('May') # L10N this is the month, not a verb
```

Similarly, multiline string literals that are not assigned to a variable can
act as a comment:

```python
"""
L10N This is a multiline
comment that is extracted
along with the string
"""
gettext('May')
```

# Example

Please see the small [example Django project](https://github.com/ilib-js/ilib-loctool-samples/django)
in the ilib-loctool-samples project for a working localization project.

# Release Notes

## v1.0.0

- initial release
