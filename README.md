# 미니 메이플스토리 — GitHub Pages용 Web Port

이 ZIP은 `KuTaeMo/JavaProject`의 README에 설명된 주요 게임 요소(인트로/암호, 플레이어 이동과 점프, 몬스터, 공격·스킬, 포인트, 레벨업, 보스)를 참고해 브라우저에서 실행되도록 HTML5 Canvas와 JavaScript로 재구성한 버전입니다.

> **중요:** 원본 Java 저장소의 실제 소스와 이미지 파일을 이 작업 환경에서 직접 내려받지 못해, Java 파일을 기계적으로 1:1 변환한 것은 아닙니다. 캐릭터·몬스터 그래픽은 이 웹 버전에 포함된 Canvas 도형으로 새로 그렸습니다. 원본 이미지와 세부 동작까지 동일하게 맞추려면 원본 저장소 ZIP을 추가로 제공해 주세요.

## 실행 방법
- `index.html`을 브라우저에서 열면 실행됩니다.
- 시작 암호는 `maple`입니다.
- 키보드: `←` / `→` 이동, `↑` 또는 `Space` 점프, `Z` 기본 공격, `X` 스킬(MP 10), `↓` 보스룸 진입(포인트 120 이상).
- 휴대폰에서는 화면 아래의 터치 버튼을 사용할 수 있습니다.

## GitHub Pages 배포
1. ZIP 압축을 풉니다.
2. GitHub에서 `KuTaeMo/JavaProject` 저장소를 엽니다.
3. 기존 Java 프로젝트를 보존하려면 먼저 별도 브랜치(예: `web-port`)를 만듭니다. 기존 파일을 교체하려는 경우에는 로컬 백업을 먼저 만드세요.
4. 이 ZIP 안의 `index.html`, `style.css`, `game.js`, `README.md`, `.nojekyll`을 저장소 루트에 업로드합니다. 폴더째로 업로드하지 말고 `index.html`이 저장소 최상위에 위치하게 합니다.
5. **Settings → Pages**에서 `Deploy from a branch`를 선택하고 브랜치(예: `main` 또는 `web-port`)와 폴더 `/ (root)`를 지정한 뒤 저장합니다.
6. Pages 배포가 완료되면 GitHub 사용자명과 저장소명을 붙인 `https://kutaemo.github.io/JavaProject/` 형식의 주소에서 확인합니다. (사용자명 대소문자는 URL에서 보통 구분되지 않습니다.)

## 파일 구성
- `index.html`: 게임 화면과 HUD, 시작 화면, 터치 조작
- `style.css`: 반응형 UI 스타일
- `game.js`: 게임 루프, 이동/점프, 몬스터 AI, 공격/스킬, 경험치/레벨, 코인, 보스룸
- `.nojekyll`: GitHub Pages에서 Jekyll 처리를 건너뛰도록 하는 파일

## 문제 해결
- 화면이 비어 있으면 `index.html`, `style.css`, `game.js`가 같은 폴더에 있는지 확인합니다.
- Pages 주소에서 404가 뜨면 Settings → Pages의 배포 브랜치/폴더와 Actions 탭의 배포 상태를 확인합니다.
- 변경 사항이 반영되지 않으면 새로고침하거나 강력 새로고침(`Ctrl + F5`)을 해보세요.
