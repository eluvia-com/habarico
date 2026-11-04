require "test_helper"

module Habarico
  module ActiveModel
    class ExtensibleEnumTest < Minitest::Test

      def build_model(list)
        Class.new do
          def self.name = 'Order'

          include ::ActiveModel::Model
          include Eluvia::ActiveModel::Attributes
          include Eluvia::ActiveModel::EnumAttribute
          include Habarico::ActiveModel::ExtensibleEnum

          string_attr :status
          extensible_enum_attr :status, list
        end
      end

      def build_polymorphic_model(list)
        Class.new do
          def self.name = 'Payment'

          include ::ActiveModel::Model
          include Eluvia::ActiveModel::Attributes
          include Habarico::ActiveModel::ExtensibleEnum

          extensible_intended_for_types list
        end
      end

      def choices(model)
        model.find_enum_attr(:status).keys
      end

      def test_declares_the_enum_from_the_list
        model = build_model(%i[draft paid])

        assert_equal %w[draft paid], choices(model)
      end

      def test_added_values_reach_every_class_declared_from_the_list
        list = %i[draft paid]
        order = build_model(list)
        invoice = build_model(list)

        ExtensibleEnum.add_values(list, %i[refunded])

        assert_equal %w[draft paid refunded], choices(order)
        assert_equal %w[draft paid refunded], choices(invoice)
      end

      def test_added_values_reach_intended_for_types
        list = %i[card transfer]
        model = build_polymorphic_model(list)

        ExtensibleEnum.add_values(list, %i[voucher])

        assert_equal %w[card transfer voucher], model.intended_for_types
      end

      def test_a_list_with_the_same_values_is_a_different_list
        order = build_model(%i[draft paid])
        invoice_statuses = %i[draft paid]
        build_model(invoice_statuses)

        ExtensibleEnum.add_values(invoice_statuses, %i[refunded])

        assert_equal %w[draft paid], choices(order)
      end

    end
  end
end
