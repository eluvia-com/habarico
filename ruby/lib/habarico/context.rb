module Habarico
  class Context
    include ::ActiveModel::Model

    # Definition of the resource on which the action is performed
    attr_accessor :definition

    # Under which user is the action performed
    attr_accessor :current_user

    # On which record primary key is the action performed
    attr_accessor :record_pk

    # On which record is the action performed
    attr_writer :record

    # Lazy load the record
    def record
      @record ||= if self.record_pk
                    self.definition.model.find_by(self.definition.model.primary_key => self.record_pk)
                  end
    end

    # In what target is the action performed (e.g. ID of the parent record)
    attr_accessor :target

    # From which source the action/schema is requested (e.g. `{ "prototype/employees" => 7 }`).
    # Used by context-aware schemas to resolve the originating resource/record.
    attr_accessor :source

    # *************************************************************************
    # Authorization
    # *************************************************************************

    STANDARD_PERMISSIONS = %i[read create update delete].freeze

    # Chooses the appropriate permission check depending on whether a record is
    # available in context.
    #
    # When a record_pk is present (e.g. the detail schema endpoint) the full
    # can_with_record? check is used so that callable permissions are evaluated
    # against the actual record. When no record is present (e.g. the global or
    # list schema endpoint) can_wo_record? is used instead.
    def can?(permission)
      record_pk.present? ? can_with_record?(permission) : can_wo_record?(permission)
    end

    def policy
      @policy ||= if self.current_user && self.record
                    Pundit.policy(self.current_user, self.record)
                  elsif self.current_user
                    Pundit.policy(self.current_user, self.definition.model)
                  end
    end

    # *************************************************************************
    # Reset
    # *************************************************************************

    def reset
      @policy = nil
      @record = nil
    end

    private

    def can_with_record?(permission)
      permission = :read if permission.blank?
      permission = permission.to_sym
      if STANDARD_PERMISSIONS.include?(permission)
        value = definition.send("can_#{permission}")
        if value.respond_to?(:call)
          !!value.call(self)
        else
          !!value
        end
      else
        value = definition.send("can")
        if value.respond_to?(:call)
          !!value.call(permission, self)
        else
          false
        end
      end
    end

    # Permission check used when generating the global or list schema, where no
    # specific record is in context.
    #
    # Static booleans are evaluated as-is — false means the action is never
    # available on this resource and should not appear in the schema at all.
    #
    # Callables are invoked with a nil record. Consumers commonly express
    # role-based restrictions as callables that depend only on current_user
    # (e.g. `can_read { |c| c.current_user.has_role?(...) }`), and these must be
    # honoured already at the global/list schema level so a restricted role does
    # not receive the whole resource. Pundit-based callables also resolve
    # without a record — Context#policy falls back to a class-level policy.
    #
    # Callables that genuinely read the concrete record simply see nil here; the
    # action may then be omitted from the list schema and its real, per-record
    # visibility is determined later by ObjectResourceSchemaGenerator (which
    # calls can? with a real record). The controller enforces the actual
    # permission on every mutating request regardless of what the schema says.
    def can_wo_record?(permission)
      permission = :read if permission.blank?
      permission = permission.to_sym
      if STANDARD_PERMISSIONS.include?(permission)
        value = definition.send("can_#{permission}")
        if value.respond_to?(:call)
          !!value.call(self)
        else
          !!value
        end
      else
        value = definition.send("can")
        if value.respond_to?(:call)
          !!value.call(permission, self)
        else
          false
        end
      end
    end

  end
end
