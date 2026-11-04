"""
Tests for what serializing binds the context to.

A schema object is declared once — on an admin class, at import — and serialized per request, so
``to_dict`` binds the context to a copy. Writing it onto the declared object would have two requests
overwrite each other's, and a getter read the one that is not its own.
"""

import threading

from habarico.schema.boxes import Box


class TestTheDeclaredObjectIsLeftAlone:

    def test_serializing_stores_nothing_on_it(self):
        box = Box(label="Basics")

        box.to_dict(prefix="first")

        assert "context" not in box.__dict__
        assert box.context is None

    def test_two_serializations_do_not_see_each_other(self):
        box = Box(label="Basics")

        first = box.to_dict(index=1)
        second = box.to_dict(index=2)

        assert (first["name"], second["name"]) == ("1", "2")


class TestTwoThreadsKeepTheirOwnContext:
    """
    The reason the copy exists. Both threads are made to sit inside a getter at the same time, so
    each one's context is bound before either reads it — with one shared object the second write
    would win for both.
    """

    def test_each_thread_reads_the_context_it_was_given(self):
        barrier = threading.Barrier(2, timeout=5)

        class _BarrierBox(Box):
            def get_label(self):
                barrier.wait()
                return self.context.prefix

        box = _BarrierBox(label="unused")
        seen = {}

        def serialize(name):
            seen[name] = box.to_dict(prefix=name)["label"]

        threads = [threading.Thread(target=serialize, args=(name,)) for name in ("one", "two")]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        assert seen == {"one": "one", "two": "two"}
