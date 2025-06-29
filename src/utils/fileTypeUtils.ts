import FileIcon from "@/icons/logo/chat/file.svg?react";
import PdfIcon from "@/icons/logo/chat/pdf.svg?react";
import DocIcon from "@/icons/logo/chat/doc.svg?react";
import XlsIcon from "@/icons/logo/chat/xls.svg?react";
import ImageIcon from "@/icons/logo/chat/image.svg?react";
import PptIcon from "@/icons/logo/chat/ppt.svg?react";

export function getFileIconAndLabel(fileName: string) {
    let icon = FileIcon;
    let label = t("Attachment");
    if (/\.(pdf)$/i.test(fileName)) {
        icon = PdfIcon;
        label = "PDF";
    } else if (/\.(doc|docx)$/i.test(fileName)) {
        icon = DocIcon;
        label = "Word";
    } else if (/\.(xls|xlsx)$/i.test(fileName)) {
        icon = XlsIcon;
        label = t("Spreadsheet");
    } else if (/\.(png|jpg|jpeg|gif|webp)$/i.test(fileName)) {
        icon = ImageIcon;
        label = t("Image");
    } else if (/\.(ppt|pptx)$/i.test(fileName)) {
        icon = PptIcon;
        label = "PowerPoint";
    }
    return { icon, label };
}