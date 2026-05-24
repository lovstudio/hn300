export type WorkType =
  | "公共艺术/装置/绘画"
  | "科技展览展示"
  | "候鸟300黑客松"
  | "戏剧作品"
  | "身体剧场/行为"
  | "音乐作品"
  | "影像作品"
  | "生活艺术"
  | "流动的画布"
  | "宠物板块";

export type Direction =
  | "常规创作"
  | "候鸟科技"
  | "流动的画布"
  | "宠物板块";

export type MaterialItem = {
  id: string;
  title: string;
  detail: string;
  format?: string;
  template?: string;
  externalTool?: {
    label: string;
    href: string;
    note: string;
  };
  required?: boolean;
};

export const eventDossier = {
  sourceUrl: "https://mp.weixin.qq.com/s/DYo-tdHx6JnbONDja1K0bg",
  title: "候鸟300 二零二六",
  place: "阿那亚的海边",
  slogan: "重新定义，正在发生",
  dates: [
    { label: "招募报名截止", value: "2026-05-12 24:00" },
    { label: "艺术家名单公布", value: "2026-05-15" },
    { label: "流动的画布名单公布", value: "2026-05-20" },
    { label: "资料提报截止", value: "2026-05-23 20:00" },
    { label: "活动现场", value: "2026-06-16 - 2026-06-29" },
  ],
  directions: [
    {
      id: "常规创作" as Direction,
      title: "常规创作",
      summary: "不限制作品类型、身份、年龄、品牌或平台，重点提交创作理念、呈现效果和过往成果。",
      tags: ["展演", "公共艺术", "生活艺术", "影像/音乐"],
    },
    {
      id: "候鸟科技" as Direction,
      title: "候鸟科技",
      summary: "面向软硬件作品、AIGC内容、创意技术实验、产品原型，以及现场黑客松共创。",
      tags: ["展览展示", "黑客松", "Token支持"],
    },
    {
      id: "流动的画布" as Direction,
      title: "流动的画布",
      summary: "候鸟300 与优衣库 UTme! 联合发起，作品需适合印制于T恤，也可同步小红书投稿。",
      tags: ["2048方图", "RGB", "版权费用"],
    },
    {
      id: "宠物板块" as Direction,
      title: "宠物板块",
      summary: "征集为宠物思考、服务宠物、供宠物体验的艺术作品，形式不限。",
      tags: ["宠物体验", "户外呈现", "安全说明"],
    },
  ],
  workTypes: [
    "公共艺术/装置/绘画",
    "科技展览展示",
    "候鸟300黑客松",
    "戏剧作品",
    "身体剧场/行为",
    "音乐作品",
    "影像作品",
    "生活艺术",
    "流动的画布",
    "宠物板块",
  ] as WorkType[],
  reportMaterials: [
    {
      id: "staff-list",
      title: "人员名单",
      detail:
        "所有到场人员都要填写姓名、性别、出生日期、国家/地区、证件类型、证件号码、职位和联系方式。",
      format: "Word",
      template: "/templates/个人或团队名+人员名单.docx",
      required: true,
    },
    {
      id: "identity",
      title: "证件信息",
      detail:
        "全部到场人员身份证正反面彩色扫描件，整合在同一个Word文件内，顺序需与人员名单一致。",
      format: "Word",
      template: "/templates/个人或团队名+身份信息（示例）.docx",
      required: true,
    },
    {
      id: "commitment",
      title: "活动承诺书",
      detail:
        "下载承诺书PDF后，可到Vadaski签名板手写签名并导出新PDF，再把签署后的PDF上传到这一条。",
      format: "PDF",
      template: "/templates/候鸟300活动承诺书.pdf",
      externalTool: {
        label: "去签名板",
        href: "https://sign.vadaski.com/",
        note: "上传PDF、手写签名、点击页面落位，然后导出签署后的PDF。",
      },
      required: true,
    },
  ] satisfies MaterialItem[],
  promoMaterials: [
    {
      id: "copy",
      title: "宣传文案",
      detail:
        "填写个人/团队名称、作品名称、作品类型、一句话简介、个人/团队介绍、作品介绍，以及演出/实体作品/影像信息。",
      format: "Word",
      template: "/templates/个人或团队名+宣传文案.docx",
      required: true,
    },
    {
      id: "images",
      title: "图片素材",
      detail:
        "每张图片10MB以内，至少横幅、竖幅各一张，提交PNG/JPG，尽量用最清晰版本。",
      format: "PNG/JPG",
      required: true,
    },
    {
      id: "poster",
      title: "海报",
      detail:
        "使用统一海报模板制作，模板位置不能移动；海报须体现个人/团队名及作品名，CMYK四色，300DPI，单张10MB以内。",
      format: "PNG/JPG",
      template: "/templates/候鸟300_艺术家_2026海报模板_黑字.png",
      required: true,
    },
    {
      id: "video",
      title: "一分钟宣传视频",
      detail:
        "横版16:9，MP4，3GB以内，片尾使用官方视频模板，视频中需口述提及“候鸟300，正在发生。”",
      format: "MP4",
      template: "/templates/候鸟300视频模板.mov",
      required: true,
    },
  ] satisfies MaterialItem[],
  specialNotes: [
    "候鸟科技分为展览展示与候鸟300黑客松，请按作品完成度选择单元。",
    "候鸟科技入选团队可获得基础电源、网络支持和Token支持至小康水平。",
    "流动的画布作品须为平面静态形式，图片2048x2048像素，RGB色彩模式，文件不超过5MB。",
    "流动的画布需同时保留AI/PSD原始设计文件，摄影作品提交高清原图或未压缩版本。",
    "小红书投稿需带话题 #流动的画布，并 @候鸟300 @优衣库 @艺术薯。",
  ],
};

export function getWorkPlan(type: WorkType): MaterialItem[] {
  const common: MaterialItem[] = [
    {
      id: "concept",
      title: "创作理念及呈现效果",
      detail: "说明作品为什么发生、在海边如何落地、观众如何观看或参与。",
      required: true,
    },
    {
      id: "past-work",
      title: "过往作品/案例/研究成果",
      detail: "整理能证明创作能力与执行经验的作品、案例、链接或研究材料。",
      required: true,
    },
  ];

  const byType: Record<WorkType, MaterialItem[]> = {
    "公共艺术/装置/绘画": [
      {
        id: "public-art-ppt",
        title: "作品方案PPT",
        detail: "包含作品阐释、完整详细的落地方案、尺寸、材质、搭建方式和现场风险说明。",
        format: "PPT",
        required: true,
      },
    ],
    科技展览展示: [
      {
        id: "tech-ppt",
        title: "科技作品方案PPT",
        detail: "说明软硬件/AIGC/产品原型的展示形态、交互方式、用电网络需求和现场安全边界。",
        format: "PPT",
        required: true,
      },
    ],
    候鸟300黑客松: [
      {
        id: "hackathon-plan",
        title: "黑客松参与方案",
        detail: "说明团队成员、研究方向、现场300小时协作计划、可路演成果和设备/算力需求。",
        format: "PPT或Word",
        required: true,
      },
    ],
    戏剧作品: [
      {
        id: "script",
        title: "完整剧本",
        detail: "提交完整剧本，演出内容应与实际现场呈现一致。",
        format: "Word",
        required: true,
      },
      {
        id: "full-video",
        title: "完整演出视频",
        detail: "MP4文件，单条视频不超过3GB。",
        format: "MP4",
        required: true,
      },
    ],
    "身体剧场/行为": [
      {
        id: "body-text",
        title: "文字描述",
        detail: "说明身体/行为作品的发生方式、时长、场地需求和观众关系。",
        format: "Word",
        required: true,
      },
      {
        id: "body-video",
        title: "完整演出视频",
        detail: "MP4文件，单条视频不超过3GB。",
        format: "MP4",
        required: true,
      },
    ],
    音乐作品: [
      {
        id: "lyrics",
        title: "曲目及歌词",
        detail: "提交现场演唱的全部曲目及歌词；外文歌词需提供中文翻译。",
        format: "Word",
        required: true,
      },
    ],
    影像作品: [
      {
        id: "film",
        title: "完整成片",
        detail: "MP4文件，单条视频不超过3GB。",
        format: "MP4",
        required: true,
      },
      {
        id: "film-text",
        title: "文字描述",
        detail: "说明影像类型、时长、创作年份和放映方式。",
        format: "Word",
        required: true,
      },
    ],
    生活艺术: [
      {
        id: "life-art-intro",
        title: "项目简介",
        detail: "说明现场经营/体验内容、服务方式、价格或参与规则。",
        format: "Word",
        required: true,
      },
      {
        id: "license",
        title: "相关经营许可证",
        detail: "涉及经营、食品、服务等内容时，提交许可证PDF扫描件。",
        format: "PDF",
      },
    ],
    流动的画布: [
      {
        id: "canvas-image",
        title: "参评完整作品图",
        detail: "2048x2048像素，RGB色彩模式，5MB以内；作品须适合T恤印制。",
        format: "PNG/JPG",
        required: true,
      },
      {
        id: "canvas-source",
        title: "原始设计文件",
        detail: "AI或PSD文件；摄影作品提交高清原图，非数字作品请扫描或高清翻拍。",
        format: "AI/PSD/原图",
        required: true,
      },
    ],
    宠物板块: [
      {
        id: "pet-ppt",
        title: "宠物作品方案PPT",
        detail: "说明作品如何服务宠物体验、现场安全、清洁维护、人宠互动边界和落地尺寸。",
        format: "PPT",
        required: true,
      },
    ],
  };

  return [...common, ...byType[type]];
}

export function getDossier() {
  return Promise.resolve(eventDossier);
}
