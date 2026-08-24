import json
import tempfile
import unittest
from pathlib import Path

from services.faq_kb import load_approved_faqs, load_base_kb, merge_kb


class FakeCursor:
    def __init__(self, rows):
        self.rows = rows
        self.sql = None

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def execute(self, sql):
        self.sql = sql

    def fetchall(self):
        return self.rows


class FakeConnection:
    def __init__(self, rows):
        self.fake_cursor = FakeCursor(rows)
        self.closed = False

    def cursor(self):
        return self.fake_cursor

    def close(self):
        self.closed = True


class FaqKbTest(unittest.TestCase):
    def test_loads_approved_faq_as_search_document(self):
        conn = FakeConnection([
            {
                "faq_id": 7,
                "question": "분실물은 어디서 찾나요?",
                "answer": "유실물센터에서 확인해 주세요.",
                "keywords": json.dumps(["분실물", "유실물"], ensure_ascii=False),
            }
        ])

        records = load_approved_faqs(lambda: conn)

        self.assertEqual(1, len(records))
        self.assertEqual("gold_faq:7", records[0]["chunk_id"])
        self.assertIn("분실물, 유실물", records[0]["text"])
        self.assertTrue(conn.closed)
        self.assertIn("WHERE is_active = 1", conn.fake_cursor.sql)

    def test_approved_faq_replaces_same_question_from_base(self):
        base = [{"question": "같은 질문", "text": "오래된 답변"}]
        approved = [{"question": "같은  질문", "text": "승인된 답변"}]

        merged = merge_kb(base, approved)

        self.assertEqual(approved, merged)

    def test_missing_base_file_is_allowed(self):
        with tempfile.TemporaryDirectory() as directory:
            records = load_base_kb(Path(directory) / "missing.jsonl")
        self.assertEqual([], records)


if __name__ == "__main__":
    unittest.main()
