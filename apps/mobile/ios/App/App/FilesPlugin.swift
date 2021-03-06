import Capacitor
import UIKit
import MobileCoreServices
import UniformTypeIdentifiers
import Foundation

@objc(FilesPlugin)
public class FilesPlugin: CAPPlugin, UIDocumentPickerDelegate,UINavigationControllerDelegate {
    private var delegate: UIDocumentPickerDelegate? = nil
    
    @objc func openFile(_ call: CAPPluginCall) {
        guard let viewController = self.bridge?.viewController else { return }
        let types = UTType.types(tag: "txt",
                                 tagClass: UTTagClass.filenameExtension,
                                 conformingTo: nil);
        
        DispatchQueue.main.async {
            let documentPickerController = UIDocumentPickerViewController(
                forOpeningContentTypes: types)
            
            self.delegate = OpenFileDelegate(call);
            documentPickerController.delegate = self.delegate;
            
            viewController.present(documentPickerController, animated: true, completion: nil)
        }
    }
    
    @objc func saveFile(_ call: CAPPluginCall) {
        guard let data = (call.getString("data") ?? "").data(using: .utf8) else {
            call.reject("Couldn't convert data to UTF")
            return
        }
        guard let path = call.getString("path") else {
            showSaveFilePicker(call, data);
            return;
        }
        
        do {
            let url = URL(string: path)!
            try data.write(to: url)
            call.resolve(FileMetadata(url))
        } catch {
            call.reject(error.localizedDescription)
        }
    }
    
    private func showSaveFilePicker(_ call: CAPPluginCall, _ data: Data) {
        guard let viewController = self.bridge?.viewController else { return }
        let fileManager = FileManager.default
        
        do {
            let path = fileManager.temporaryDirectory.appendingPathComponent("Lyrics.txt")
            try data.write(to: path)
            
            DispatchQueue.main.async {
                let documentPickerController = UIDocumentPickerViewController(
                    forExporting: [path])
                
                self.delegate = SaveFileDelegate(call);
                documentPickerController.delegate = self.delegate;
                
                viewController.present(documentPickerController, animated: true, completion: nil)
            }
        } catch {
            call.reject("Unable to create temp file.")
            return
        }
    }
}

private func FileMetadata(_ path: URL) -> [String: Any] {
    return ["path": path.absoluteString, "name": path.lastPathComponent];
}

private func FileData(_ path: URL, _ data: String) -> [String: Any] {
    return FileMetadata(path).merging(["data": data]) { (current, _) in current }
}

private class OpenFileDelegate : NSObject, UIDocumentPickerDelegate {
    private let call: CAPPluginCall;
    
    init(_ call: CAPPluginCall) {
        self.call = call;
    }
    
    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let filePath = urls.first else {
            return
        }
        do {
            if let text = String(data: try Data(contentsOf: filePath), encoding: .utf8) {
                call.resolve(FileData(filePath, text));
            }
        } catch {
            call.reject("Unable to read the selected file");
        }
    }
    
    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        self.call.resolve();
    }
}

private class SaveFileDelegate : NSObject, UIDocumentPickerDelegate {
    private let call: CAPPluginCall;
    
    init(_ call: CAPPluginCall) {
        self.call = call;
    }
    
    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let filePath = urls.first else {
            return
        }
        call.resolve(["path": filePath.absoluteString, "name": filePath.lastPathComponent]);
    }
    
    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        self.call.resolve();
    }
}
