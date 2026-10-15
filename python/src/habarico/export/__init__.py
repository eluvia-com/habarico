"""
Export of admin list data into downloadable files.

Off by default: a resource opts in with ``ModelAdmin.export_enabled``. CSV is built in, XLSX needs
the ``export-xlsx`` extra (``pip install 'habarico[export-xlsx]'``) and its renderer added to
``ADMIN_REST_FRAMEWORK["EXPORT_RENDERER_CLASSES"]``.

The package re-exports nothing: import a name from the submodule it lives in -
``habarico.export.views``, ``.renderers``, ``.generators``, ``.config``, ``.wiring``.
``habarico.admin`` imports ``config`` and ``wiring`` on module level and Django imports ``habarico``
while it iterates ``INSTALLED_APPS``, so a package-level import of the viewset or the renderers
would pull them into the import graph of every project - exporting or not. That is the import
chain HAB-852 was about.
"""
