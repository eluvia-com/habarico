module Habarico
  class LinkActionParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # External URL for the action link
    string_attr :url

    # Target for opening the link, either in the same tab or a new tab
    string_attr :target
    enum_attr :target, Types::LINK_TARGET_TYPE

  end
end
