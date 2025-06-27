
export function getFileIconAndLabel(fileName: string) {
    let icon = "logo/chat/file.svg";
    let label = t("Attachment");
    if (/\.(pdf)$/i.test(fileName)) {
        icon = "logo/chat/pdf.svg";
        label = "PDF";
    } else if (/\.(doc|docx)$/i.test(fileName)) {
        icon = "logo/chat/doc.svg";
        label = "Word";
    } else if (/\.(xls|xlsx)$/i.test(fileName)) {
        icon = "logo/chat/xls.svg";
        label = t("Spreadsheet");
    } else if (/\.(png|jpg|jpeg|gif|webp)$/i.test(fileName)) {
        icon = "logo/chat/image.svg";
        label = t("Image");
    } else if (/\.(ppt|pptx)$/i.test(fileName)) {
        icon = "logo/chat/ppt.svg";
        label = "PowerPoint";
    } else if (/\.(zip|rar|7z)$/i.test(fileName)) {
        icon = "logo/chat/zip.svg";
        label = t("Archive");
    }
    return { icon, label };
}