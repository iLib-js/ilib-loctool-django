from django.utils.translation import ugettext as _

def x(self):
    with activated_language(user=self):
        email_html(self, _("Activate your account"))
