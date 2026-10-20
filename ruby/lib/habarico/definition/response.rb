module Habarico
  class Response
    include DefinitionModel

    # `action` is the follow-up action the frontend runs once it has this response. It accepts the
    # name of an action declared in `actions`, a `Habarico::Action` built on the spot (an ad-hoc
    # action the resource does not declare) or a complete `Habarico::ActionSchema` - see
    # `Habarico::Controller#build_action_schema`.
    #
    # `data` is merged next to `meta` in the rendered `ActionResult`, which is where the contract
    # allows an action to return a payload of its own.
    attr_accessor :message, :state, :action, :data

    def initialize(params = {})
      @state = :success
      super(params)
    end

  end
end
