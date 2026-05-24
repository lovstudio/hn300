import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import JSZip from "jszip";
import {
  AlertTriangle,
  Archive,
  CalendarClock,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  Link,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type Direction,
  type MaterialItem,
  type WorkType,
  eventDossier,
  getDossier,
  getWorkPlan,
} from "@/data/event";

type Profile = {
  entityName: string;
  workName: string;
  teamMode: "个人" | "团队";
  peopleCount: number;
  direction: Direction;
  workType: WorkType;
  needsTent: boolean;
  ticketing: "否" | "是" | "待定";
};

const defaultProfile: Profile = {
  entityName: "",
  workName: "",
  teamMode: "团队",
  peopleCount: 3,
  direction: "候鸟科技",
  workType: "科技展览展示",
  needsTent: false,
  ticketing: "待定",
};

const profileKey = "houniao-300-profile";
const netdiskKey = "houniao-300-netdisk";
const submissionDeadline = new Date("2026-05-23T20:00:00+08:00");
const mb = 1024 * 1024;
const largePackageThreshold = 1024 * mb;

type PackageGroup = "报批资料" | "宣传物料";

type UploadSlot = {
  id: string;
  title: string;
  detail: string;
  folder: PackageGroup;
  targetBase: string;
  accept: string;
  extensions: string[];
  template?: string;
  externalTool?: MaterialItem["externalTool"];
  maxSizeMB?: number;
  required?: boolean;
  multiple?: boolean;
  manualCheck?: string;
};

type NetdiskDraft = {
  url: string;
  code: string;
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function deadlineCopy() {
  const now = new Date();
  const diff = submissionDeadline.getTime() - now.getTime();
  const hour = 1000 * 60 * 60;
  if (diff < 0) {
    const overdueHours = Math.ceil(Math.abs(diff) / hour);
    return {
      tone: "overdue",
      label: `资料提报截止已过 ${overdueHours} 小时`,
      detail: "请立即联系候鸟300官方确认是否仍可补交或更新资料。",
    };
  }
  if (diff <= 24 * hour) {
    return {
      tone: "urgent",
      label: `距离资料提报截止不足 ${Math.ceil(diff / hour)} 小时`,
      detail: "优先完成报批资料，宣传物料同步压缩命名。",
    };
  }
  return {
    tone: "open",
    label: `距离资料提报截止还有 ${Math.ceil(diff / (24 * hour))} 天`,
    detail: "先锁定人员名单和作品方案，再补齐宣传素材。",
  };
}

function cleanName(name: string) {
  return name.trim() || "个人或团队名";
}

function cleanFilePart(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]/g, "-") || "未命名";
}

function readableSize(bytes: number) {
  if (bytes >= 1024 * mb) return `${(bytes / (1024 * mb)).toFixed(2)}GB`;
  return `${(bytes / mb).toFixed(bytes >= 10 * mb ? 0 : 1)}MB`;
}

function fileExtension(fileName: string) {
  return fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
}

function acceptFor(format?: string) {
  if (!format) {
    return {
      accept: ".doc,.docx,.ppt,.pptx,.pdf,.zip,.rar",
      extensions: ["doc", "docx", "ppt", "pptx", "pdf", "zip", "rar"],
    };
  }
  if (format.includes("MP4")) return { accept: ".mp4,.mov", extensions: ["mp4", "mov"] };
  if (format.includes("PPT")) return { accept: ".ppt,.pptx,.pdf", extensions: ["ppt", "pptx", "pdf"] };
  if (format.includes("Word")) return { accept: ".doc,.docx", extensions: ["doc", "docx"] };
  if (format.includes("PDF")) return { accept: ".pdf", extensions: ["pdf"] };
  if (format.includes("PNG") || format.includes("JPG")) return { accept: ".png,.jpg,.jpeg", extensions: ["png", "jpg", "jpeg"] };
  if (format.includes("AI") || format.includes("PSD")) {
    return {
      accept: ".ai,.psd,.png,.jpg,.jpeg,.tif,.tiff",
      extensions: ["ai", "psd", "png", "jpg", "jpeg", "tif", "tiff"],
    };
  }
  return {
    accept: ".doc,.docx,.ppt,.pptx,.pdf,.zip,.rar",
    extensions: ["doc", "docx", "ppt", "pptx", "pdf", "zip", "rar"],
  };
}

function materialBaseName(item: MaterialItem) {
  const map: Record<string, string> = {
    "staff-list": "人员名单",
    identity: "身份信息",
    commitment: "活动承诺书",
    copy: "宣传文案",
    images: "图片素材",
    poster: "海报",
    video: "宣传视频",
    concept: "创作理念及呈现效果",
    "past-work": "过往作品案例",
    "public-art-ppt": "作品方案",
    "tech-ppt": "作品方案",
    "hackathon-plan": "黑客松参与方案",
    script: "完整剧本",
    "full-video": "完整演出视频",
    "body-text": "身体剧场文字描述",
    "body-video": "完整演出视频",
    lyrics: "曲目及歌词",
    film: "完整成片",
    "film-text": "影像文字描述",
    "life-art-intro": "项目简介",
    license: "经营许可证",
    "canvas-image": "流动画布参评作品",
    "canvas-source": "流动画布原始设计文件",
    "pet-ppt": "宠物作品方案",
  };
  return map[item.id] ?? item.title;
}

function buildPackageSlots(profile: Profile, workPlan: MaterialItem[]) {
  const name = cleanFilePart(cleanName(profile.entityName));
  const toSlot = (item: MaterialItem, folder: PackageGroup): UploadSlot => {
    const accepted = acceptFor(item.format);
    const isVideo = item.id === "video" || item.id === "full-video" || item.id === "body-video" || item.id === "film";
    const isImageSet = item.id === "images";
    const isPoster = item.id === "poster";
    const isCanvasImage = item.id === "canvas-image";
    return {
      id: item.id,
      title: item.title,
      detail: item.detail,
      folder,
      targetBase: `${name}+${materialBaseName(item)}`,
      accept: accepted.accept,
      extensions: accepted.extensions,
      template: item.template,
      externalTool: item.externalTool,
      maxSizeMB: isVideo ? 3072 : isImageSet || isPoster ? 10 : isCanvasImage ? 5 : undefined,
      required: item.required,
      multiple: isImageSet || item.id === "past-work",
      manualCheck: isImageSet
        ? "请确认至少包含横幅、竖幅各一张。"
        : isPoster
          ? "请确认使用官方海报模板，300DPI，模板位置未移动。"
          : isVideo
            ? "请确认视频横版16:9，并包含官方片尾。"
            : isCanvasImage
              ? "请确认图片为2048x2048像素、RGB色彩模式。"
              : undefined,
    };
  };

  return [
    ...eventDossier.reportMaterials.map((item) => toSlot(item, "报批资料")),
    ...workPlan.map((item) => toSlot(item, "报批资料")),
    ...eventDossier.promoMaterials.map((item) => toSlot(item, "宣传物料")),
  ];
}

function slotMessages(slot: UploadSlot, files: File[]) {
  const messages: { type: "ok" | "warn" | "error"; text: string }[] = [];
  if (slot.required && files.length === 0) messages.push({ type: "error", text: "缺少必填文件" });
  if (slot.id === "images" && files.length > 0 && files.length < 2) {
    messages.push({ type: "warn", text: "图片素材建议至少2张，并包含横幅、竖幅" });
  }
  for (const file of files) {
    const extension = fileExtension(file.name);
    if (!slot.extensions.includes(extension)) {
      messages.push({ type: "error", text: `${file.name} 格式不符合要求` });
    }
    if (slot.maxSizeMB && file.size > slot.maxSizeMB * mb) {
      messages.push({
        type: "error",
        text: `${file.name} 超过 ${slot.maxSizeMB >= 1024 ? `${slot.maxSizeMB / 1024}GB` : `${slot.maxSizeMB}MB`}`,
      });
    }
  }
  if (files.length > 0 && messages.length === 0) messages.push({ type: "ok", text: "文件已选择，基础格式通过" });
  if (files.length > 0 && slot.manualCheck) messages.push({ type: "warn", text: slot.manualCheck });
  if (slot.externalTool && files.length === 0) messages.push({ type: "warn", text: slot.externalTool.note });
  return messages;
}

function packageFileName(slot: UploadSlot, file: File, index: number, count: number) {
  const extension = fileExtension(file.name) || "file";
  const suffix = count > 1 ? `(${index + 1})` : "";
  return `${slot.targetBase}${suffix}.${extension}`;
}

function buildPackageManifest(
  profile: Profile,
  slots: UploadSlot[],
  filesBySlot: Record<string, File[]>,
  netdisk: NetdiskDraft,
) {
  const name = cleanFilePart(cleanName(profile.entityName));
  const root = `${name}+候鸟300资料`;
  const lines = [
    "候鸟300 二零二六资料包提交清单",
    "",
    `生成时间：${new Date().toLocaleString("zh-CN")}`,
    `个人/团队名称：${cleanName(profile.entityName)}`,
    `作品名称：${profile.workName.trim() || "未填写"}`,
    `报名身份：${profile.teamMode}`,
    `到场人数：${profile.peopleCount}`,
    `报名方向：${profile.direction}`,
    `作品类型：${profile.workType}`,
    `是否申请帐篷：${profile.needsTent ? "是" : "否"}`,
    `是否售票：${profile.ticketing}`,
    "",
    "资料包结构：",
    `${root}/`,
    `  ${name}+报批资料/`,
    `  ${name}+宣传物料/`,
    "",
    "已选择文件：",
  ];

  slots.forEach((slot) => {
    const files = filesBySlot[slot.id] ?? [];
    if (files.length === 0) {
      lines.push(`- [缺少] ${slot.folder}/${slot.targetBase}`);
      return;
    }
    files.forEach((file, index) => {
      lines.push(`- ${slot.folder}/${packageFileName(slot, file, index, files.length)} <= ${file.name} (${readableSize(file.size)})`);
    });
  });

  lines.push(
    "",
    "提交提醒：",
    "- 上传到百度网盘后，请设置分享链接永久有效。",
    "- 上传完成后，请打开链接检查文件夹是否可访问、可下载。",
    "- 单条视频不要超过3GB。",
    "- 身份证、承诺书等敏感材料请确认只通过官方报名表提交。",
  );

  if (netdisk.url.trim()) {
    lines.push("", "百度网盘链接：", netdisk.url.trim());
    if (netdisk.code.trim()) lines.push(`提取码：${netdisk.code.trim()}`);
  }

  return lines.join("\n");
}

function App() {
  const { data = eventDossier } = useQuery({
    queryKey: ["event-dossier"],
    queryFn: getDossier,
  });
  const [profile, setProfile] = useState<Profile>(() =>
    loadJson(profileKey, defaultProfile),
  );
  const [filesBySlot, setFilesBySlot] = useState<Record<string, File[]>>({});
  const [netdisk, setNetdisk] = useState<NetdiskDraft>(() =>
    loadJson(netdiskKey, { url: "", code: "" }),
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [zipProgress, setZipProgress] = useState<number | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);
  const status = useMemo(() => deadlineCopy(), []);
  const workPlan = useMemo(() => getWorkPlan(profile.workType), [profile.workType]);
  const packageSlots = useMemo(
    () => buildPackageSlots(profile, workPlan),
    [profile, workPlan],
  );
  const selectedFiles = useMemo(() => Object.values(filesBySlot).flat(), [filesBySlot]);
  const selectedBytes = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const packageMessages = packageSlots.flatMap((slot) =>
    slotMessages(slot, filesBySlot[slot.id] ?? []),
  );
  const packageErrors = packageMessages.filter((message) => message.type === "error").length;
  const packageReady = selectedFiles.length > 0 && packageErrors === 0;
  const netdiskValid = /^https?:\/\/(pan|yun)\.baidu\.com\//.test(netdisk.url.trim());
  const finalSubmitText = useMemo(
    () =>
      [
        "候鸟300 二零二六资料提交",
        `个人/团队名称：${cleanName(profile.entityName)}`,
        `作品名称：${profile.workName.trim() || "未填写"}`,
        `报名方向：${profile.direction}`,
        `作品类型：${profile.workType}`,
        `百度网盘链接：${netdisk.url.trim() || "待填写"}`,
        netdisk.code.trim() ? `提取码：${netdisk.code.trim()}` : "",
        "链接已设置永久有效，文件可正常打开、下载和查看。",
      ]
        .filter(Boolean)
        .join("\n"),
    [netdisk.code, netdisk.url, profile],
  );

  useEffect(() => {
    window.localStorage.setItem(profileKey, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    window.localStorage.setItem(netdiskKey, JSON.stringify(netdisk));
  }, [netdisk]);

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const updateSlotFiles = (slotId: string, files: FileList | null) => {
    setFilesBySlot((current) => ({
      ...current,
      [slotId]: files ? Array.from(files) : [],
    }));
    setZipError(null);
  };

  const removeSlotFile = (slotId: string, fileIndex: number) => {
    setFilesBySlot((current) => ({
      ...current,
      [slotId]: (current[slotId] ?? []).filter((_, index) => index !== fileIndex),
    }));
  };

  const generatePackage = async () => {
    setZipError(null);
    setZipProgress(0);
    try {
      const name = cleanFilePart(cleanName(profile.entityName));
      const rootName = `${name}+候鸟300资料`;
      const zip = new JSZip();
      const root = zip.folder(rootName);
      const reportFolder = root?.folder(`${name}+报批资料`);
      const promoFolder = root?.folder(`${name}+宣传物料`);
      if (!root || !reportFolder || !promoFolder) throw new Error("资料包目录创建失败");

      packageSlots.forEach((slot) => {
        const folder = slot.folder === "报批资料" ? reportFolder : promoFolder;
        const files = filesBySlot[slot.id] ?? [];
        files.forEach((file, index) => {
          folder.file(packageFileName(slot, file, index, files.length), file);
        });
      });
      root.file(`${name}+提交清单.txt`, buildPackageManifest(profile, packageSlots, filesBySlot, netdisk));

      const blob = await zip.generateAsync(
        {
          type: "blob",
          compression: selectedBytes > 512 * mb ? "STORE" : "DEFLATE",
          compressionOptions: { level: 1 },
        },
        (metadata) => setZipProgress(Math.round(metadata.percent)),
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${rootName}.zip`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setZipProgress(null);
    } catch (error) {
      setZipProgress(null);
      setZipError(error instanceof Error ? error.message : "资料包生成失败，请减少大文件后重试。");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="site-header">
        <a className="brand-lockup" href="#top" aria-label="候鸟300报名助手">
          <img src="/logo.svg" alt="" className="brand-mark" />
          <span>候鸟300 报名助手</span>
        </a>
        <nav aria-label="页面导航">
          <a href="#direction">方向</a>
          <a href="#materials">资料包</a>
          <a href="#netdisk">网盘</a>
        </nav>
      </header>

      <section className="hero-band" id="top">
        <div className="hero-copy">
          <p className="eyebrow">2026-06-16 - 2026-06-29 · 阿那亚的海边</p>
          <h1>
            <span>把候鸟300报名资料</span>
            <span>一次整理到可提交。</span>
          </h1>
          <p className="lead">
            根据招募细则和资料收集包，先确定报名方向与作品类型，再生成文件命名、资料清单和提交前检查。
          </p>
          <div className={`deadline-strip ${status.tone}`}>
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong>{status.label}</strong>
              <span>{status.detail}</span>
            </div>
          </div>
          <div className="hero-actions">
            <Button asChild size="lg">
              <a href="#materials">
                <ClipboardCheck aria-hidden="true" />
                处理资料
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={data.sourceUrl} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" />
                官方招募原文
              </a>
            </Button>
          </div>
        </div>

        <div className="hero-visual" aria-label="候鸟300活动视觉与报名二维码">
          <img src="/event-cover.webp" alt="候鸟300 二零二六活动视觉" />
          <div className="qr-panel">
            <img src="/signup-qr.webp" alt="候鸟300官方报名二维码" />
            <span>官方报名二维码</span>
          </div>
        </div>
      </section>

      <section className="section-band timeline-band" aria-labelledby="timeline-title">
        <div className="section-heading">
          <p className="eyebrow">关键日期</p>
          <h2 id="timeline-title">先按最早截止倒排。</h2>
        </div>
        <div className="timeline-grid">
          {data.dates.map((date) => (
            <article className="date-card" key={date.label}>
              <CalendarClock aria-hidden="true" />
              <span>{date.label}</span>
              <strong>{date.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="section-band" id="direction" aria-labelledby="direction-title">
        <div className="section-heading">
          <p className="eyebrow">第一步</p>
          <h2 id="direction-title">选择报名方向和作品类型。</h2>
        </div>

        <div className="direction-layout">
          <form className="profile-panel">
            <label>
              <span>个人/团队名称</span>
              <input
                value={profile.entityName}
                placeholder="例如：张三 / 某某实验室"
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    entityName: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>作品名称</span>
              <input
                value={profile.workName}
                placeholder="用于海报、宣传文案和文件名"
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    workName: event.target.value,
                  }))
                }
              />
            </label>
            <div className="form-grid">
              <label>
                <span>报名身份</span>
                <select
                  value={profile.teamMode}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      teamMode: event.target.value as Profile["teamMode"],
                    }))
                  }
                >
                  <option>个人</option>
                  <option>团队</option>
                </select>
              </label>
              <label>
                <span>到场人数</span>
                <input
                  min={1}
                  type="number"
                  value={profile.peopleCount}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      peopleCount: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>
            <div className="form-grid">
              <label>
                <span>报名方向</span>
                <select
                  value={profile.direction}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      direction: event.target.value as Direction,
                    }))
                  }
                >
                  {data.directions.map((direction) => (
                    <option key={direction.id}>{direction.id}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>作品类型</span>
                <select
                  value={profile.workType}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      workType: event.target.value as WorkType,
                    }))
                  }
                >
                  {data.workTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={profile.needsTent}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      needsTent: event.target.checked,
                    }))
                  }
                />
                需要申请海边帐篷
              </label>
              <label>
                <span>是否售票</span>
                <select
                  value={profile.ticketing}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      ticketing: event.target.value as Profile["ticketing"],
                    }))
                  }
                >
                  <option>否</option>
                  <option>是</option>
                  <option>待定</option>
                </select>
              </label>
            </div>
          </form>

          <div className="direction-cards">
            {data.directions.map((direction) => (
              <button
                className={`direction-card ${profile.direction === direction.id ? "active" : ""}`}
                key={direction.id}
                type="button"
                onClick={() =>
                  setProfile((current) => ({
                    ...current,
                    direction: direction.id,
                    workType:
                      direction.id === "流动的画布"
                        ? "流动的画布"
                        : direction.id === "宠物板块"
                          ? "宠物板块"
                          : direction.id === "候鸟科技"
                            ? "科技展览展示"
                            : current.workType,
                  }))
                }
              >
                <strong>{direction.title}</strong>
                <span>{direction.summary}</span>
                <em>{direction.tags.join(" / ")}</em>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band muted-band" id="materials" aria-labelledby="materials-title">
        <div className="section-heading">
          <p className="eyebrow">第二步</p>
          <h2 id="materials-title">按资料条目逐项处理。</h2>
        </div>
        <div className="material-workbench">
          <div className="upload-panel">
            <div className="panel-title">
              <ShieldCheck aria-hidden="true" />
              <div>
                <h3>每一条直接下载模板、选择文件、看校验结果</h3>
                <p>所有素材只在浏览器本地处理；文件不会上传到我们的服务器。</p>
              </div>
            </div>
            <div className="package-summary">
              <span>
                已选择 <strong>{selectedFiles.length}</strong> 个文件
              </span>
              <span>
                总大小 <strong>{readableSize(selectedBytes)}</strong>
              </span>
              <span className={packageErrors ? "bad" : "good"}>
                {packageErrors ? `${packageErrors} 个错误` : "基础校验通过"}
              </span>
            </div>
            {selectedBytes > largePackageThreshold ? (
              <div className="large-warning">
                <AlertTriangle aria-hidden="true" />
                <span>资料包超过1GB。浏览器仍会尝试打包，但大视频更稳妥的做法是按下方文件结构手动放入文件夹。</span>
              </div>
            ) : null}
            <div className="slot-list">
              {packageSlots.map((slot) => (
                <UploadSlotRow
                  files={filesBySlot[slot.id] ?? []}
                  key={slot.id}
                  onRemove={(index) => removeSlotFile(slot.id, index)}
                  onSelect={(files) => updateSlotFiles(slot.id, files)}
                  slot={slot}
                />
              ))}
            </div>
          </div>

          <aside className="package-panel">
            <div className="panel-title">
              <Archive aria-hidden="true" />
              <div>
                <h3>生成最终资料包</h3>
                <p>按条目选择完文件后，下载 zip，再手动上传到百度网盘。</p>
              </div>
            </div>
            <div className="package-tree">
              <code>{cleanFilePart(cleanName(profile.entityName))}+候鸟300资料/</code>
              <code>  {cleanFilePart(cleanName(profile.entityName))}+报批资料/</code>
              <code>  {cleanFilePart(cleanName(profile.entityName))}+宣传物料/</code>
              <code>  {cleanFilePart(cleanName(profile.entityName))}+提交清单.txt</code>
            </div>
            {zipProgress !== null ? (
              <div className="progress-track" aria-label={`打包进度 ${zipProgress}%`}>
                <span style={{ width: `${zipProgress}%` }} />
              </div>
            ) : null}
            {zipError ? (
              <p className="zip-error">
                <XCircle aria-hidden="true" />
                {zipError}
              </p>
            ) : null}
            <Button disabled={!packageReady || zipProgress !== null} onClick={generatePackage} size="lg">
              <Download aria-hidden="true" />
              {zipProgress !== null ? `正在打包 ${zipProgress}%` : "下载最终资料包 zip"}
            </Button>
            <p className="package-hint">如果包含接近3GB的视频，zip 打包可能较慢。失败时按建议结构手动整理文件夹即可。</p>
          </aside>
        </div>
      </section>

      <section className="section-band" id="netdisk" aria-labelledby="netdisk-title">
        <div className="section-heading">
          <p className="eyebrow">第三步</p>
          <h2 id="netdisk-title">上传百度网盘后，生成最终提交文本。</h2>
        </div>
        <div className="netdisk-layout">
          <div className="netdisk-panel">
            <div className="panel-title">
              <Link aria-hidden="true" />
              <div>
                <h3>粘贴百度网盘链接</h3>
                <p>请先把 zip 或解压后的总文件夹上传到百度网盘，并把分享链接设为永久有效。</p>
              </div>
            </div>
            <label>
              <span>百度网盘链接</span>
              <input
                value={netdisk.url}
                placeholder="https://pan.baidu.com/s/..."
                onChange={(event) =>
                  setNetdisk((current) => ({ ...current, url: event.target.value }))
                }
              />
            </label>
            <label>
              <span>提取码，没有可留空</span>
              <input
                value={netdisk.code}
                placeholder="例如：a1b2"
                onChange={(event) =>
                  setNetdisk((current) => ({ ...current, code: event.target.value }))
                }
              />
            </label>
            <p className={netdiskValid ? "netdisk-ok" : "netdisk-warn"}>
              {netdiskValid ? "链接格式看起来正常，请确认已设置永久有效。" : "请填写 pan.baidu.com 或 yun.baidu.com 开头的百度网盘链接。"}
            </p>
          </div>
          <div className="final-text-panel">
            <div className="panel-title">
              <ClipboardCheck aria-hidden="true" />
              <div>
                <h3>最终复制到报名表</h3>
                <p>这段文字用于粘贴到报名表或和组委会沟通。</p>
              </div>
            </div>
            <pre>{finalSubmitText}</pre>
            <Button
              disabled={!netdiskValid}
              onClick={() => copyText("final-submit", finalSubmitText)}
              variant="outline"
            >
              <Copy aria-hidden="true" />
              {copied === "final-submit" ? "已复制" : "复制最终提交文本"}
            </Button>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <span>候鸟300 二零二六报名助手</span>
        <span>资料来源：本地招募稿与“候鸟300 二零二六 资料收集”模板。</span>
      </footer>
    </main>
  );
}

export default App;

function UploadSlotRow({
  files,
  onRemove,
  onSelect,
  slot,
}: {
  files: File[];
  onRemove: (index: number) => void;
  onSelect: (files: FileList | null) => void;
  slot: UploadSlot;
}) {
  const messages = slotMessages(slot, files);
  return (
    <article className="upload-row">
      <div className="upload-main">
        <div>
          <strong>
            {slot.required ? <span aria-hidden="true">*</span> : null}
            {slot.title}
          </strong>
          <small>{slot.folder} · 目标命名：{slot.targetBase}</small>
        </div>
        <p>{slot.detail}</p>
        <div className="upload-messages">
          {messages.map((message) => (
            <span className={message.type} key={`${slot.id}-${message.text}`}>
              {message.text}
            </span>
          ))}
        </div>
        {files.length > 0 ? (
          <ul className="selected-files">
            {files.map((file, index) => (
              <li key={`${file.name}-${file.lastModified}`}>
                <span>
                  <strong>{packageFileName(slot, file, index, files.length)}</strong>
                  <small>来自 {file.name} · {readableSize(file.size)}</small>
                </span>
                <button type="button" onClick={() => onRemove(index)} aria-label={`移除 ${file.name}`}>
                  <XCircle aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="row-actions">
        {slot.template ? (
          <a className="template-chip" href={slot.template} download>
            <Download aria-hidden="true" />
            <span>模板</span>
          </a>
        ) : null}
        {slot.externalTool ? (
          <a
            className="tool-chip"
            href={slot.externalTool.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden="true" />
            <span>{slot.externalTool.label}</span>
          </a>
        ) : null}
        <label className="file-picker">
          <Upload aria-hidden="true" />
          <span>{files.length ? "重新选择" : "选择文件"}</span>
          <input
            accept={slot.accept}
            multiple={slot.multiple}
            onChange={(event) => onSelect(event.target.files)}
            type="file"
          />
        </label>
      </div>
    </article>
  );
}
