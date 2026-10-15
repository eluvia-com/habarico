module Habarico
  class ConfirmDialogProperties
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Title of the confirm dialog
    string_attr :title

    # Message of the confirm dialog
    string_attr :message

  end
end
