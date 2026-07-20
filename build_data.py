import os
import re
import json

# Define the file configurations with categories and valid question ranges
FILES_CONFIG = [
    {
        "path": "数据结构/数据结构01.md",
        "category": "数据结构",
        "range": range(1, 13)
    },
    {
        "path": "数据结构/数据结构02.md",
        "category": "数据结构",
        "range": range(13, 26)
    },
    {
        "path": "数据结构/数据结构03.md",
        "category": "数据结构",
        "range": range(26, 38)
    },
    {
        "path": "流程控制/流程控制.md",
        "category": "流程控制",
        "range": range(38, 45)
    },
    {
        "path": "数据库/数据库01.md",
        "category": "数据库",
        "range": range(45, 55)
    },
    {
        "path": "进阶/优化.md",
        "category": "性能优化",
        "range": range(55, 60)
    },
    {
        "path": "进阶/并发编程.md",
        "category": "并发编程",
        "range": range(60, 70)
    },
    {
        "path": "进阶/高级特性01.md",
        "category": "高级特性",
        "range": range(70, 78)
    },
    {
        "path": "进阶/高级特性02.md",
        "category": "高级特性",
        "range": range(78, 86)
    },
    {
        "path": "进阶/高级特性03.md",
        "category": "高级特性",
        "range": range(86, 94)
    },
    {
        "path": "rust/rust基础.md",
        "category": "Rust 基础",
        "range": range(94, 101)
    },
    {
        "path": "rust/solana.md",
        "category": "Solana 进阶",
        "range": range(101, 114)
    },
    {
        "path": "进阶/预测市场.md",
        "category": "预测市场",
        "range": range(114, 121)
    },
    {
        "path": "进阶/跨链桥.md",
        "category": "跨链桥",
        "range": range(121, 127)
    }
]

# Base directory for the interview questions (webpage/docs)
BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs")

def parse_file(config):
    file_path = os.path.join(BASE_DIR, config["path"])
    if not os.path.exists(file_path):
        print(f"Warning: File not found: {file_path}")
        return []

    print(f"Parsing: {config['path']} (Category: {config['category']})")
    
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    questions = []
    current_q = None
    in_core_answer = False
    core_lines = []
    content_lines = []
    alert_type = "tip"  # default alert type

    # Regex to match question headings: e.g. "### 1. 连 nil 切片..." or "## Q60. 对已经关闭..."
    # Matches: ## or ### followed by optional spaces, optional "Q", digits, dot, spaces, title
    q_re = re.compile(r'^(?:##|###)\s*(?:Q)?(\d+)\.\s*(.*)', re.IGNORECASE)

    for line in lines:
        match = q_re.match(line)
        if match:
            # Found a heading. Check if the question number falls in the config's valid range.
            q_num = int(match.group(1))
            q_title = match.group(2).strip()

            if q_num in config["range"]:
                # Save previous question if there was one
                if current_q:
                    current_q["core_answer"] = {
                        "type": alert_type,
                        "text": "".join(core_lines).strip()
                    }
                    current_q["content"] = "".join(content_lines).strip()
                    questions.append(current_q)
                
                # Start new question
                current_q = {
                    "id": f"Q{q_num}",
                    "number": q_num,
                    "title": q_title,
                    "category": config["category"]
                }
                in_core_answer = False
                core_lines = []
                content_lines = []
                alert_type = "tip"
                continue

            else:
                # Number out of range, this is a subheading inside a question
                pass

        # If we are inside a question, parse its body
        if current_q:
            # Check for core answer block
            # Format: > [!TIP] or > [!IMPORTANT] or > [!CAUTION] or > [!WARNING] or > [!NOTE]
            if line.startswith(">"):
                # Clean up line prefix
                clean_line = line.lstrip(">").strip()
                
                # Check if this line defines the alert type
                alert_match = re.match(r'^\[!(TIP|IMPORTANT|CAUTION|WARNING|NOTE)\]', clean_line, re.IGNORECASE)
                if alert_match:
                    in_core_answer = True
                    alert_type = alert_match.group(1).lower()
                    continue
                
                # Also ignore lines like "**核心回答**" or "**核心回答：**" inside the block
                if in_core_answer:
                    if re.match(r'^\*{2}核心回答：?\*{2}$', clean_line):
                        continue
                    core_lines.append(clean_line + "\n")
                else:
                    content_lines.append(line)
            else:
                if in_core_answer:
                    # End of core answer block (first line that does not start with '>')
                    in_core_answer = False
                content_lines.append(line)

    # Save the last question in the file
    if current_q:
        current_q["core_answer"] = {
            "type": alert_type,
            "text": "".join(core_lines).strip()
        }
        current_q["content"] = "".join(content_lines).strip()
        questions.append(current_q)

    print(f"Successfully parsed {len(questions)} questions from {config['path']}")
    return questions

def main():
    all_questions = []
    for config in FILES_CONFIG:
        all_questions.extend(parse_file(config))

    # Sort questions by number
    all_questions.sort(key=lambda x: x["number"])

    output_js_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.js")
    
    # Format data as a JS file that declares a global variable
    js_content = f"window.INTERVIEW_DATA = {json.dumps(all_questions, ensure_ascii=False, indent=2)};"
    
    with open(output_js_path, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    print(f"Data generation complete! Saved to: {output_js_path}")
    print(f"Total questions compiled: {len(all_questions)}")

if __name__ == "__main__":
    main()
